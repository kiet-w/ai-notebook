'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export interface NoteCardFailedProps {
  content?: string | null;
  onRetry?: () => void;
}

export function NoteCardFailed({ content, onRetry }: NoteCardFailedProps) {
  const { t } = useI18n();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">{t('notes.failedToAnalyze')}</p>
          {content && (
            <p className="text-xs text-red-600/70 dark:text-red-400/50 line-clamp-2 italic mb-3">&quot;{content}&quot;</p>
          )}
          <button 
            className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 cursor-pointer"
            onClick={handleRetry}
          >
            <RefreshCw className="w-3 h-3" />
            {t('common.retry')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteCardFailed;
