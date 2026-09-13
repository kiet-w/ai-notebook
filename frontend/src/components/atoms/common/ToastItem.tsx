'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItemData, ToastType } from '@/types/toast';
import { cn, toastVariants } from '@/lib/ui-styles';

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

const typeConfigs: Record<
  ToastType,
  {
    icon: React.ReactNode;
    titleColor: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    titleColor: 'text-emerald-950 dark:text-emerald-100',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    titleColor: 'text-red-950 dark:text-red-100',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    titleColor: 'text-amber-950 dark:text-amber-100',
  },
  info: {
    icon: <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />,
    titleColor: 'text-zinc-950 dark:text-zinc-100',
  },
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const config = typeConfigs[toast.type] || typeConfigs.info;

  return (
    <div
      role="alert"
      className={cn(toastVariants({ type: toast.type }))}
    >
      {config.icon}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className={cn('text-xs font-semibold leading-tight mb-0.5', config.titleColor)}>
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

