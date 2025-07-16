import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NoteViewer from '../NoteViewer';

test('loads and displays note', async () => {
  const mockNote = {
    id: '1',
    title: 'Test note',
    content: 'Nội dung',
    createdAt: new Date().toISOString(),
  };
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(mockNote) })
  );

  render(
    <MemoryRouter initialEntries={[`/note/${mockNote.id}`]}>
      <Routes>
        <Route path="/note/:noteId" element={<NoteViewer />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText(/Đang tải ghi chú/)).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText('Test note')).toBeInTheDocument());

  global.fetch.mockRestore && global.fetch.mockRestore();
});
