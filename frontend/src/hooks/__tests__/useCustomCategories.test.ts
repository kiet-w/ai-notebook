import { renderHook, act } from '@testing-library/react';
import { useCustomCategories } from '../useCustomCategories';

describe('useCustomCategories hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('initializes with empty custom categories when storage is empty', () => {
    const { result } = renderHook(() => useCustomCategories());
    expect(result.current.customCategories).toEqual([]);
  });

  it('adds a new valid category successfully', () => {
    const { result } = renderHook(() => useCustomCategories());

    act(() => {
      const res = result.current.addCategory('Design');
      expect(res.success).toBe(true);
      expect(res.category).toBe('Design');
    });

    expect(result.current.customCategories).toContain('Design');
  });

  it('rejects duplicate or default category names', () => {
    const { result } = renderHook(() => useCustomCategories());

    // Cooking is a default category
    act(() => {
      const res = result.current.addCategory('cooking');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Category already exists');
    });

    // Add custom category
    act(() => {
      result.current.addCategory('Marketing');
    });

    // Add duplicate custom category
    act(() => {
      const res = result.current.addCategory('MARKETING');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Category already exists');
    });
  });

  it('deletes a custom category', () => {
    const { result } = renderHook(() => useCustomCategories());

    act(() => {
      result.current.addCategory('Travel');
    });
    expect(result.current.customCategories).toContain('Travel');

    act(() => {
      result.current.deleteCategory('Travel');
    });
    expect(result.current.customCategories).not.toContain('Travel');
  });
});
