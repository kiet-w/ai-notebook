'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, XCircle } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import { Category } from '@/types/note';

const CATEGORY_OPTIONS: { id: Category; emoji: string }[] = [
  { id: 'Cooking', emoji: '🍳' },
  { id: 'Tech', emoji: '💻' },
  { id: 'Learning', emoji: '📚' },
  { id: 'Work', emoji: '💼' },
  { id: 'Finance', emoji: '💰' },
  { id: 'Other', emoji: '📝' },
];

interface NoteInputProps {
  onSubmit: (content: string, category?: Category) => void;
  onUpload?: (file: File, category?: Category) => void;
  disabled?: boolean;
  showCategorySelector?: boolean;
}

export default function NoteInput({ onSubmit, onUpload, disabled, showCategorySelector }: NoteInputProps) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let url: string | null = null;
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [selectedFile]);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

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
      // Find if there is any file, prioritising images
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
    // Reset input value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:shadow-md focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-200">
      <form onSubmit={handleSubmit} className="flex flex-col p-2">
        {selectedFile && (
          <div className="flex items-center gap-3 px-4 py-2.5 mx-2 mt-2 mb-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
            <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
              ) : (
                <span className="text-lg">📄</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{selectedFile.name}</p>
              <p className="text-[10px] font-medium text-zinc-500 tracking-wide mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedFile(null)}
              className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
        <Input
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Capture a thought... (Enter to save, Ctrl+V to paste image)"
          rows={1}
          disabled={disabled}
        />

        {showCategorySelector && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2">
            {CATEGORY_OPTIONS.map(({ id, emoji }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedCategory(prev => prev === id ? undefined : id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
                  selectedCategory === id
                    ? 'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300 shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200/60 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700/40 dark:hover:bg-zinc-700/50'
                }`}
              >
                <span className="text-sm leading-none select-none">{emoji}</span>
                <span>{id}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center px-4 pb-2">
          <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
            {content.length > 0 ? `${content.length} characters` : 'Notion style capture'}
          </div>
          <div className="flex items-center gap-1.5">
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
                  onClick={triggerFileInput}
                  disabled={disabled}
                  title="Upload Document"
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
