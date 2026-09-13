import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteInput from '../NoteInput';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'notes.thoughtPlaceholder') return 'Capture your thought...';
      if (key === 'notes.notionCapture') return 'Notion style capture';
      if (key === 'notes.charCount') return `${params?.count} chars`;
      if (key === 'notes.categories') return 'Categories';
      if (key === 'categories.tech') return 'Tech';
      return key;
    },
  }),
}));

jest.mock('@/hooks/useCustomCategories', () => ({
  useCustomCategories: () => ({
    addCategory: jest.fn(),
    customCategories: [],
  }),
}));

describe('NoteInput component', () => {
  it('renders input area and submit button', () => {
    const mockSubmit = jest.fn();
    render(<NoteInput onSubmit={mockSubmit} />);

    expect(screen.getByPlaceholderText('Capture your thought...')).toBeInTheDocument();
  });

  it('renders category selector popover button when showCategorySelector is true', () => {
    const mockSubmit = jest.fn();
    render(
      <NoteInput
        onSubmit={mockSubmit}
        showCategorySelector={true}
        categories={['Tech', 'Work']}
      />
    );

    expect(screen.getByRole('button', { name: /Categories/i })).toBeInTheDocument();
  });

  it('allows selecting category and submitting with content', () => {
    const mockSubmit = jest.fn();
    render(
      <NoteInput
        onSubmit={mockSubmit}
        showCategorySelector={true}
        categories={['Tech', 'Work']}
      />
    );

    // Open category popover and choose Tech
    fireEvent.click(screen.getByRole('button', { name: /Categories/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tech/i }));

    // Type content
    const textarea = screen.getByPlaceholderText('Capture your thought...');
    fireEvent.change(textarea, { target: { value: 'My test note' } });

    // Submit with Enter key
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockSubmit).toHaveBeenCalledWith('My test note', 'Tech');
  });
});
