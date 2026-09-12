import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

export interface AnalyzingToastProps {
  title?: string;
  description?: string;
  className?: string;
}

export const AnalyzingToast = memo(function AnalyzingToast({
  title = 'Analyzing note',
  description = 'Classifying category...',
  className = '',
}: AnalyzingToastProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rounded-2xl p-4 max-w-xs ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-primary">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="flex flex-col min-w-0">
        <h4 className="text-xs font-bold text-foreground leading-none mb-1 select-none">{title}</h4>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">{description}</p>
      </div>
    </div>
  );
});

export default AnalyzingToast;
