export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItemData {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}
