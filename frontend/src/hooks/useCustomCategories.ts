'use client';

import { useState, useEffect, useCallback } from 'react';
import { normalizeCategoryName, DEFAULT_CATEGORIES } from '@/utils/category';

const STORAGE_KEY = 'ai_notebook_custom_categories';
const EVENT_KEY = 'custom_categories_changed';

function getStoredCategories(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read custom categories from localStorage', err);
  }
  return [];
}

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<string[]>(getStoredCategories);

  useEffect(() => {
    const handleUpdate = () => {
      setCustomCategories(getStoredCategories());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        handleUpdate();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_KEY, handleUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_KEY, handleUpdate);
    };
  }, []);

  const addCategory = useCallback(
    (name: string): { success: boolean; error?: string; category?: string } => {
      const trimmed = name.trim();
      if (!trimmed) {
        return { success: false, error: 'Category name cannot be empty' };
      }

      const normalized = normalizeCategoryName(trimmed);
      const isDefault = DEFAULT_CATEGORIES.some(
        (c) => c.id.toLowerCase() === normalized.toLowerCase()
      );

      if (isDefault || customCategories.some((c) => c.toLowerCase() === normalized.toLowerCase())) {
        return { success: false, error: 'Category already exists', category: normalized };
      }

      const updated = [...customCategories, normalized];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCustomCategories(updated);
        window.dispatchEvent(new Event(EVENT_KEY));
        return { success: true, category: normalized };
      } catch (err) {
        console.error('Failed to save category to localStorage', err);
        return { success: false, error: 'Failed to persist category' };
      }
    },
    [customCategories]
  );

  const deleteCategory = useCallback(
    (name: string) => {
      const normalized = normalizeCategoryName(name);
      const updated = customCategories.filter(
        (c) => c.toLowerCase() !== normalized.toLowerCase()
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCustomCategories(updated);
        window.dispatchEvent(new Event(EVENT_KEY));
      } catch (err) {
        console.error('Failed to delete category from localStorage', err);
      }
    },
    [customCategories]
  );

  return {
    customCategories,
    addCategory,
    deleteCategory,
  };
}
