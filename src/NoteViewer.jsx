import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './NoteViewer.css';

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function NoteViewer() {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [password, setPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/notes/${noteId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Ghi chú không tồn tại hoặc đã hết hạn');
        } else {
          setError('Có lỗi xảy ra khi tải ghi chú');
        }
        return;
      }

      const noteData = await response.json();

      if (noteData.hasPassword) {
        setIsPasswordRequired(true);
      } else {
        setNote(noteData);
      }
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error);
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPassword = async () => {
    try {
      const response = await fetch(`${API_BASE}/notes/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: noteId, password }),
      });

      const result = await response.json();
      
      if (result.verified) {
        // Tải lại ghi chú sau khi xác thực thành công
        const noteResponse = await fetch(`${API_BASE}/notes/${noteId}`);
        const noteData = await noteResponse.json();
        setNote(noteData);
        setIsPasswordRequired(false);
      } else {
        setError('Mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Lỗi khi xác thực mật khẩu:', error);
      setError('Có lỗi xảy ra khi xác thực mật khẩu');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      verifyPassword();
    }
  };

  if (isLoading) {
    return (
      <div className="note-viewer">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải ghi chú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="note-viewer">
        <div className="error">
          <h2>❌ Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (isPasswordRequired) {
    return (
      <div className="note-viewer">
        <div className="password-form">
          <h2>🔒 Ghi chú được bảo vệ</h2>
          <p>Ghi chú này yêu cầu mật khẩu để xem</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Xem ghi chú</button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="note-viewer">
        <div className="error">
          <h2>❌ Không tìm thấy ghi chú</h2>
          <p>Ghi chú này có thể đã bị xóa hoặc không tồn tại</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-viewer">
      <div className="note-container">
        <header className="note-header">
          <h1>{note.title}</h1>
          <div className="note-meta">
            <span className="created-date">
              📅 Tạo: {new Date(note.createdAt).toLocaleString('vi-VN')}
            </span>
            {note.deadline && (
              <span className="deadline">
                ⏰ Hết hạn: {new Date(note.deadline).toLocaleString('vi-VN')}
              </span>
            )}
            {note.hasPassword && (
              <span className="protected">🔒 Có bảo vệ</span>
            )}
          </div>
        </header>
        
        <div className="note-content">
          <pre>{note.content}</pre>
        </div>
        
        <footer className="note-footer">
          <p>Được tạo bởi AI Assistant App</p>
        </footer>
      </div>
    </div>
  );
}

export default NoteViewer;

