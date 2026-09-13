import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastItem } from '../ToastItem';
import { ToastItemData } from '@/types/toast';

describe('ToastItem', () => {
  const mockToast: ToastItemData = {
    id: 'test-toast-1',
    title: 'Lỗi 400',
    message: 'Invalid email address',
    type: 'error',
    duration: 4000,
    createdAt: Date.now(),
  };

  it('renders title and message correctly', () => {
    const onDismiss = jest.fn();
    render(<ToastItem toast={mockToast} onDismiss={onDismiss} />);

    expect(screen.getByText('Lỗi 400')).toBeInTheDocument();
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ToastItem toast={mockToast} onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', { name: /đóng thông báo/i });
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalledWith('test-toast-1');
  });

  it('renders success toast without title', () => {
    const onDismiss = jest.fn();
    const successToast: ToastItemData = {
      id: 'success-1',
      message: 'Đăng nhập thành công',
      type: 'success',
      duration: 3000,
      createdAt: Date.now(),
    };
    render(<ToastItem toast={successToast} onDismiss={onDismiss} />);

    expect(screen.getByText('Đăng nhập thành công')).toBeInTheDocument();
  });
});
