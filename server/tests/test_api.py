import json
import pytest
from server.app import app

@pytest.fixture(autouse=True)
def temp_notes_file(tmp_path, monkeypatch):
    temp_file = tmp_path / "notes.json"
    temp_file.write_text("[]")
    monkeypatch.setattr('server.app.NOTES_FILE', str(temp_file))

@pytest.fixture
def client():
    with app.test_client() as c:
        yield c

def test_list_notes_empty(client):
    rv = client.get('/notes')
    assert rv.status_code == 200
    assert json.loads(rv.data) == []

def test_create_note(client):
    payload = {"title": "t", "content": "c", "password": "p"}
    rv = client.post('/notes', json=payload)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data["title"] == "t"
    assert data["hasPassword"] is True
    assert "password" not in data

    list_rv = client.get('/notes')
    notes = list_rv.get_json()
    assert len(notes) == 1
    assert notes[0]["title"] == "t"
    assert notes[0]["hasPassword"] is True
    assert "password" not in notes[0]

    verify_rv = client.post('/notes/verify-password', json={"id": data["id"], "password": "p"})
    assert verify_rv.status_code == 200
    assert verify_rv.get_json()["verified"] is True
