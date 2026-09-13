'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { ToastItemData, ToastOptions } from '@/types/toast';
import { ToastContainer } from '@/components/molecules/common/ToastContainer';

export interface ToastContextValue {
  toasts: ToastItemData[];
  showToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options.duration ?? DEFAULT_DURATION;
      const type = options.type ?? 'info';

      const newToast: ToastItemData = {
        id,
        title: options.title,
        message: options.message,
        type,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Keep at most 5 toasts to avoid overflowing screen
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered.slice(-4), newToast];
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const toastHelpers = useMemo(
    () => ({
      success: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: 'success', duration }),
      error: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: 'error', duration }),
      warning: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: 'warning', duration }),
      info: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: 'info', duration }),
    }),
    [showToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      removeToast,
      toast: toastHelpers,
    }),
    [toasts, showToast, removeToast, toastHelpers],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

const defaultToastHelpers = {
  success: () => '',
  error: () => '',
  warning: () => '',
  info: () => '',
};

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: () => '',
      removeToast: () => {},
      toast: defaultToastHelpers,
    };
  }
  return context;
}

export default ToastProvider;
