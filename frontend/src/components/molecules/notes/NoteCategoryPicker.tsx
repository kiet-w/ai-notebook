'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Category } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryLabel } from '@/utils/category';
import { useCustomCategories } from '@/hooks/useCustomCategories';

export interface NoteCategoryPickerProps {
  categories: string[];
  selectedCategory?: Category;
  onSelectCategory: (category?: Category) => void;
}

export function NoteCategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
}: NoteCategoryPickerProps) {
  const { t } = useI18n();
  const { addCategory } = useCustomCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    const res = addCategory(trimmed);
    if (res.success && res.category) {
      onSelectCategory(res.category as Category);
    }
    setNewCatName('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
      {categories.map((catId) => {
        const label = getCategoryLabel(catId, t);
        const isSelected = selectedCategory === catId;

        return (
          <button
            key={catId}
            type="button"
            onClick={() => onSelectCategory(isSelected ? undefined : (catId as Category))}
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
              isSelected
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
                : 'bg-zinc-100/70 text-zinc-600 border-zinc-200/60 hover:bg-zinc-200/70 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-800/60 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span>{label}</span>
          </button>
        );
      })}

      {/* Inline Add Category */}
      {isAdding ? (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewCatName('');
              }
            }}
            placeholder={t('notes.newCategory') || 'Tên...'}
            className="w-20 text-xs px-1 py-0.5 bg-transparent focus:outline-none dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={!newCatName.trim()}
            className="p-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-30 cursor-pointer"
            title={t('common.save')}
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewCatName('');
            }}
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            title={t('common.cancel')}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          title={t('notes.addCategory') || 'Thêm danh mục'}
        >
          <span>+ {t('notes.addCategory') || 'Thêm'}</span>
        </button>
      )}
    </div>
  );
}

export default NoteCategoryPicker;

