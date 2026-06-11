'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';

interface NoteInputProps {
  onSubmit: (content: string) => void;
  onUpload?: (file: File) => void;
  disabled?: boolean;
}

export default function NoteInput({ onSubmit, onUpload, disabled }: NoteInputProps) {
  const [content, setContent] = useState('');
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || disabled) return;
    onSubmit(content);
    setContent('');
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
        onUpload(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
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
              disabled={disabled || !content.trim()}
            >
              <Icon icon={Send} size={16} />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
