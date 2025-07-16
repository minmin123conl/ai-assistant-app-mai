// API helper functions
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const createNote = async (noteData) => {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(noteData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi tạo ghi chú');
  }
  
  const result = await response.json();
  return result;
};

export const getNoteById = async (noteId) => {
  const response = await fetch(`${API_BASE}/notes/${noteId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Không tìm thấy ghi chú');
  }
  
  return response.json();
};

export const verifyNotePassword = async (noteId, password) => {
  const response = await fetch(`${API_BASE}/notes/verify-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: noteId, password }),
  });
  
  if (!response.ok) {
    return false;
  }
  
  const result = await response.json();
  return result.verified;
};

export const saveNote = async (noteData) => {
  return createNote(noteData);
};

export const getNote = async (noteId) => {
  return getNoteById(noteId);
};

export const listNotes = async () => {
  const response = await fetch(`${API_BASE}/notes`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy danh sách ghi chú');
  }
  
  return response.json();
};

export const deleteNote = async (noteId) => {
  const response = await fetch(`${API_BASE}/notes/${noteId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi xóa ghi chú');
  }

  return response.json();
};

