'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Paperclip } from 'lucide-react';
import Button from '@/components/atoms/common/Button';
import Input from '@/components/atoms/common/Input';
import Icon from '@/components/atoms/common/Icon';
import { Category } from '@/types/note';
import { useI18n } from '@/hooks/useI18n';
import { getAvailableCategories } from '@/utils/category';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import NoteFilePreview from './NoteFilePreview';
import NoteCategoryPicker from './NoteCategoryPicker';

export interface NoteInputProps {
  onSubmit: (content: string, category?: Category) => void;
  onUpload?: (file: File, category?: Category) => void;
  disabled?: boolean;
  showCategorySelector?: boolean;
  categories?: string[];
}

export function NoteInput({ onSubmit, onUpload, disabled, showCategorySelector, categories }: NoteInputProps) {
  const { t } = useI18n();
  const { customCategories } = useCustomCategories();
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = useMemo(() => {
    const allCustom = categories ? Array.from(new Set([...categories, ...customCategories])) : customCategories;
    return getAvailableCategories(undefined, undefined, allCustom);
  }, [categories, customCategories]);

  const previewUrl = useMemo(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled || (!content.trim() && !selectedFile)) return;

    if (selectedFile && onUpload) {
      onUpload(selectedFile, selectedCategory);
      setSelectedFile(null);
    } else {
      onSubmit(content, selectedCategory);
    }

    setContent('');
    setSelectedCategory(undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData.files;
    if (files && files.length > 0) {
      const file = Array.from(files).find(f => f.type.startsWith('image/')) || files[0];
      if (file && onUpload) {
        e.preventDefault();
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      setSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:shadow-md focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-200">
      <form onSubmit={handleSubmit} className="flex flex-col p-2">
        {selectedFile && (
          <NoteFilePreview
            file={selectedFile}
            previewUrl={previewUrl}
            onRemove={() => setSelectedFile(null)}
          />
        )}
        <Input
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={t('notes.thoughtPlaceholder')}
          rows={1}
          disabled={disabled}
        />

        <div className="flex justify-between items-center px-4 pb-2 pt-1 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 min-w-0">
            {showCategorySelector && (
              <NoteCategoryPicker
                categories={availableCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                disabled={disabled}
              />
            )}
            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider truncate">
              {content.length > 0 ? t('notes.charCount', { count: content.length }) : t('notes.notionCapture')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {mounted && onUpload && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.epub,.txt,.csv"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  title={t('notes.uploadDoc')}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Icon icon={Paperclip} size={16} />
                </button>
              </>
            )}
            <Button
              type="submit"
              disabled={disabled || (!content.trim() && !selectedFile)}
            >
              <Icon icon={Send} size={16} />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NoteInput;
