import React, { memo } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Category, Status } from '@/types/note';
import { cn } from '@/lib/ui-styles';

export interface RecentImportRowProps {
  title: string;
  category?: Category;
  status: Status;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const getStatusIcon = (status: Status) => {
  switch (status) {
    case 'PROCESSING':
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500 shrink-0" />;
    case 'COMPLETED':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    case 'FAILED':
      return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  }
};

export const RecentImportRow = memo(function RecentImportRow({
  title,
  category,
  status,
  onClick,
  disabled = status === 'PROCESSING',
  className,
}: RecentImportRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer group text-left disabled:cursor-default disabled:opacity-70',
        className
      )}
    >
      {getStatusIcon(status)}
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {title}
      </span>
      {category && (
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest shrink-0">
          {category}
        </span>
      )}
      {status === 'COMPLETED' && category && (
        <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
      )}
    </button>
  );
});

export default RecentImportRow;
