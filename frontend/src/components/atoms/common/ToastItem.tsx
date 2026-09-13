'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItemData, ToastType } from '@/types/toast';

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<
  ToastType,
  {
    container: string;
    icon: React.ReactNode;
    titleColor: string;
  }
> = {
  success: {
    container:
      'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    titleColor: 'text-emerald-950 dark:text-emerald-100',
  },
  error: {
    container:
      'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    titleColor: 'text-red-950 dark:text-red-100',
  },
  warning: {
    container:
      'bg-amber-50/95 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    titleColor: 'text-amber-950 dark:text-amber-100',
  },
  info: {
    container:
      'bg-zinc-50/95 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200',
    icon: <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />,
    titleColor: 'text-zinc-950 dark:text-zinc-100',
  },
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 min-w-[280px] max-w-sm ${style.container}`}
    >
      {style.icon}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className={`text-xs font-semibold leading-tight mb-0.5 ${style.titleColor}`}>
            {toast.title}
          </h4>
        )}
        <p className="text-xs leading-relaxed opacity-90 break-words whitespace-pre-line">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity text-current cursor-pointer shrink-0"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ToastItem;
