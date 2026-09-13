import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCategoryPicker from '../NoteCategoryPicker';

const mockAddCategory = jest.fn();

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      if (key === 'notes.categories') return 'Categories';
      if (key === 'notes.addCategory') return 'Add Category';
      if (key === 'notes.newCategory') return 'New Category';
      if (key === 'common.cancel') return 'Cancel';
      if (key === 'common.save') return 'Save';
      if (key === 'categories.cooking') return 'Cooking';
      if (key === 'categories.tech') return 'Tech';
      if (key === 'categories.work') return 'Work';
      return key;
    },
  }),
}));

jest.mock('@/hooks/useCustomCategories', () => ({
  useCustomCategories: () => ({
    addCategory: mockAddCategory,
    customCategories: [],
  }),
}));

describe('NoteCategoryPicker', () => {
  const categories = ['Tech', 'Cooking', 'Work'];
  const mockOnSelectCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button when no category is selected', () => {
    render(
      <NoteCategoryPicker
        categories={categories}
        onSelectCategory={mockOnSelectCategory}
      />
    );

    expect(screen.getByRole('button', { name: /Categories/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens popover dialog on click and displays categories', () => {
    render(
      <NoteCategoryPicker
        categories={categories}
        onSelectCategory={mockOnSelectCategory}
      />
    );

    const trigger = screen.getByRole('button', { name: /Categories/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tech/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cooking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Work/i })).toBeInTheDocument();
  });

  it('calls onSelectCategory and closes popover when a category is chosen', () => {
    render(
      <NoteCategoryPicker
        categories={categories}
        onSelectCategory={mockOnSelectCategory}
      />
    );

    // Open popover
    fireEvent.click(screen.getByRole('button', { name: /Categories/i }));

    // Click Tech
    const techBtn = screen.getByRole('button', { name: /Tech/i });
    fireEvent.click(techBtn);

    expect(mockOnSelectCategory).toHaveBeenCalledWith('Tech');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders selected category badge with deselect button', () => {
    render(
      <NoteCategoryPicker
        categories={categories}
        selectedCategory="Tech"
        onSelectCategory={mockOnSelectCategory}
      />
    );

    expect(screen.getByText('Tech')).toBeInTheDocument();

    const deselectBtn = screen.getByLabelText('Cancel');
    fireEvent.click(deselectBtn);

    expect(mockOnSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('closes popover on Escape key', () => {
    render(
      <NoteCategoryPicker
        categories={categories}
        onSelectCategory={mockOnSelectCategory}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Categories/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports adding a new category from popover', () => {
    mockAddCategory.mockReturnValue({ success: true, category: 'Design' });

    render(
      <NoteCategoryPicker
        categories={categories}
        onSelectCategory={mockOnSelectCategory}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Categories/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add Category/i }));

    const input = screen.getByPlaceholderText('New Category');
    fireEvent.change(input, { target: { value: 'Design' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockAddCategory).toHaveBeenCalledWith('Design');
    expect(mockOnSelectCategory).toHaveBeenCalledWith('Design');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
