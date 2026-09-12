import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImportHero from '../ImportHero';

// Mock I18n
jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'notes.importTitle') return 'Secondary Brain';
      if (key === 'notes.importSubtitle') return 'AI-powered capture';
      if (key === 'notes.createCategoryPlaceholder') return 'Create a new category...';
      if (key === 'notes.createCategoryButton') return 'Add Category';
      if (key === 'notes.categoryCreatedSuccess') return `Category "${params?.name}" created successfully!`;
      if (key === 'notes.categoryExistsError') return `Category "${params?.name}" already exists`;
      return key;
    },
  }),
}));

describe('ImportHero component', () => {
  it('renders category creator input and button', () => {
    render(<ImportHero />);
    expect(screen.getByPlaceholderText('Create a new category...')).toBeInTheDocument();
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('calls onCreateCategory when form is submitted', () => {
    const mockCreate = jest.fn().mockReturnValue({ success: true, category: 'Design' });
    render(<ImportHero onCreateCategory={mockCreate} />);

    const input = screen.getByPlaceholderText('Create a new category...');
    fireEvent.change(input, { target: { value: 'Design' } });

    const button = screen.getByText('Add Category');
    fireEvent.click(button);

    expect(mockCreate).toHaveBeenCalledWith('Design');
  });
});
