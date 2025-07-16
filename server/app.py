from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"]) # Enable CORS for all routes

NOTES_FILE = os.path.join(os.path.dirname(__file__), 'notes.json')

def load_notes():
    if not os.path.exists(NOTES_FILE) or os.path.getsize(NOTES_FILE) == 0:
        return []
    try:
        with open(NOTES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        # Handle corrupted JSON file by returning an empty list and logging
        app.logger.error(f"Error decoding JSON from {NOTES_FILE}. File might be corrupted. Returning empty list.")
        return []

def save_notes(notes):
    with open(NOTES_FILE, 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=4)

def cleanup_expired_notes():
    notes = load_notes()
    current_time = datetime.now()
    updated_notes = []
    for note in notes:
        if note.get('deadline'):
            try:
                deadline_time = datetime.fromisoformat(note['deadline'])
                if deadline_time > current_time:
                    updated_notes.append(note)
                else:
                    app.logger.info(f"Note '{note.get('title', note['id'])}' expired and removed.")
            except ValueError:
                # Keep notes with invalid deadline format, or handle as needed
                updated_notes.append(note)
        else:
            updated_notes.append(note)
    if len(notes) != len(updated_notes):
        save_notes(updated_notes)

@app.route('/notes', methods=['POST'])
def create_note():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON input"}), 400

        title = data.get('title')
        content = data.get('content')
        password = data.get('password')
        deadline = data.get('deadline')

        if not title or not content:
            return jsonify({"error": "Title and content are required"}), 400

        notes = load_notes()
        hashed_password = generate_password_hash(password) if password else None
        new_note = {
            'id': str(uuid.uuid4()),
            'title': title,
            'content': content,
            'password': hashed_password,
            'deadline': deadline if deadline else None,
            'createdAt': datetime.now().isoformat()
        }
        notes.append(new_note)
        save_notes(notes)

        response_note = new_note.copy()
        response_note['hasPassword'] = bool(password)
        response_note.pop('password', None)

        return jsonify(response_note), 201
    except Exception as e:
        app.logger.error(f"Error creating note: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/notes', methods=['GET'])
def list_notes():
    try:
        cleanup_expired_notes()  # Clean up expired notes before listing
        notes = load_notes()
        # Only return notes that are not expired
        current_time = datetime.now()
        active_notes = []
        for note in notes:
            if note.get('deadline'):
                try:
                    deadline_time = datetime.fromisoformat(note['deadline'])
                    if deadline_time > current_time:
                        active_notes.append(note)
                except ValueError:
                    # If deadline is invalid, treat as active (or handle as error)
                    active_notes.append(note)
            else:
                active_notes.append(note)

        response_notes = []
        for n in active_notes:
            n_copy = n.copy()
            n_copy['hasPassword'] = bool(n_copy.get('password'))
            n_copy.pop('password', None)
            response_notes.append(n_copy)

        return jsonify(response_notes), 200
    except Exception as e:
        app.logger.error(f"Error listing notes: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<note_id>', methods=['GET'])
def get_note(note_id):
    try:
        cleanup_expired_notes()
        notes = load_notes()
        note = next((n for n in notes if n['id'] == note_id), None)
        if not note:
            return jsonify({"error": "Note not found"}), 404
        
        # Check if the note has expired before returning
        if note.get('deadline'):
            try:
                deadline_time = datetime.fromisoformat(note['deadline'])
                if deadline_time <= datetime.now():
                    return jsonify({"error": "Note has expired"}), 404 # Treat as not found if expired
            except ValueError:
                pass # Invalid deadline, treat as not expired

        note_copy = note.copy()
        note_copy['hasPassword'] = bool(note_copy.get('password'))
        note_copy.pop('password', None)

        return jsonify(note_copy), 200
    except Exception as e:
        app.logger.error(f"Error getting note {note_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    try:
        notes = load_notes()
        initial_len = len(notes)
        notes = [n for n in notes if n['id'] != note_id]
        if len(notes) == initial_len:
            return jsonify({"error": "Note not found"}), 404
        save_notes(notes)
        return jsonify({"message": "Note deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error deleting note {note_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/notes/verify-password', methods=['POST'])
def verify_note_password():
    try:
        data = request.get_json()
        note_id = data.get('id')
        password = data.get('password')

        notes = load_notes()
        note = next((n for n in notes if n['id'] == note_id), None)

        if not note:
            return jsonify({"error": "Note not found"}), 404

        stored_hash = note.get('password')
        if stored_hash and password and check_password_hash(stored_hash, password):
            return jsonify({"verified": True}), 200
        else:
            return jsonify({"verified": False, "error": "Incorrect password"}), 401
    except Exception as e:
        app.logger.error(f"Error verifying password: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run cleanup on startup to ensure consistency
    cleanup_expired_notes()
    app.run(debug=True, host='0.0.0.0', port=5000)


