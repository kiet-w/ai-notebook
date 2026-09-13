'use client';

import { useToastContext } from '@/providers/ToastProvider';

export function useToast() {
  const { toast, showToast, removeToast, toasts } = useToastContext();

  return {
    toast,
    showToast,
    removeToast,
    toasts,
  };
}

export default useToast;
