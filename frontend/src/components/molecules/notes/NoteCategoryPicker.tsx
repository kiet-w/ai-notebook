'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Tag, ChevronDown, Plus } from 'lucide-react';
import { Category } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import { getCategoryLabel, getCategoryEmoji } from '@/utils/category';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { cn } from '@/lib/ui-styles';

export interface NoteCategoryPickerProps {
  categories: string[];
  selectedCategory?: Category;
  onSelectCategory: (category?: Category) => void;
  disabled?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

export function NoteCategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
  disabled = false,
  align = 'left',
  className,
}: NoteCategoryPickerProps) {
  const { t } = useI18n();
  const { addCategory } = useCustomCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewCatName('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsAdding(false);
        setNewCatName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
    setIsOpen(false);
  };

  const selectedCategoryLabel = selectedCategory ? getCategoryLabel(selectedCategory, t) : null;
  const selectedCategoryEmoji = selectedCategory ? getCategoryEmoji(selectedCategory) : null;

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      {/* Trigger Button */}
      {selectedCategory ? (
        <div className="inline-flex items-center rounded-lg border border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs text-xs font-medium">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
            title={selectedCategoryLabel || t('notes.categories') || 'Danh mục'}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <span>{selectedCategoryEmoji}</span>
            <span className="max-w-[100px] truncate">{selectedCategoryLabel}</span>
            <ChevronDown
              className={cn('w-3 h-3 opacity-70 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onSelectCategory(undefined);
            }}
            disabled={disabled}
            className="p-1 pr-2 hover:opacity-75 cursor-pointer disabled:cursor-not-allowed"
            title={t('common.cancel') || 'Bỏ chọn'}
            aria-label={t('common.cancel') || 'Bỏ chọn'}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer select-none',
            isOpen
              ? 'bg-zinc-200/80 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
              : 'bg-zinc-100/80 text-zinc-600 border-zinc-200/70 hover:bg-zinc-200/70 hover:text-zinc-900 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={t('notes.categories') || 'Danh mục'}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Tag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>{t('notes.categories') || 'Danh mục'}</span>
          <ChevronDown
            className={cn('w-3 h-3 text-zinc-400 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>
      )}

      {/* Popover Dropdown Panel (Horizontal Layout) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t('notes.categories') || 'Danh mục'}
          className={cn(
            'absolute z-50 w-max max-w-[calc(100vw-2.5rem)] sm:max-w-md p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl animate-in fade-in zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0',
            'top-full mt-1.5'
          )}
        >
          <div className="px-1 pb-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {t('notes.categories') || 'Danh mục'}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto p-0.5 scrollbar-thin">
            {categories.map((catId) => {
              const label = getCategoryLabel(catId, t);
              const emoji = getCategoryEmoji(catId);
              const isSelected = selectedCategory === catId;

              return (
                <button
                  key={catId}
                  type="button"
                  onClick={() => {
                    onSelectCategory(isSelected ? undefined : (catId as Category));
                    setIsOpen(false);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer select-none',
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
                      : 'bg-zinc-100/80 text-zinc-700 border-zinc-200/70 hover:bg-zinc-200/80 hover:text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/60 dark:hover:bg-zinc-700/80'
                  )}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 shrink-0" />}
                </button>
              );
            })}

            {/* Inline Add Custom Category in horizontal flow */}
            {isAdding ? (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 shadow-xs">
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t('notes.addCategory') || 'Thêm'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteCategoryPicker;


