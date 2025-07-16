import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Basic smoke test
test('renders schedule tab by default', () => {
  render(<App />);
  expect(screen.getByText('📅 Thời Gian Biểu')).toBeInTheDocument();
});

test('switches to notes tab', () => {
  render(<App />);
  const notesButton = screen.getByRole('button', { name: '📝 Ghi Chú' });
  fireEvent.click(notesButton);
  expect(screen.getByText(/Tạo ghi chú/)).toBeInTheDocument();
});
