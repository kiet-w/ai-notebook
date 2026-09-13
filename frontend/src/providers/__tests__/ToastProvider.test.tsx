import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../ToastProvider';
import { useToast } from '@/hooks/useToast';

const TestComponent = () => {
  const { toast, removeToast } = useToast();

  return (
    <div>
      <button
        onClick={() => toast.error('Validation failed: invalid email', 'Lỗi 400', 5000)}
      >
        Trigger Error
      </button>
      <button onClick={() => toast.success('Operation succeeded', 'Thành công')}>
        Trigger Success
      </button>
      <button onClick={() => removeToast('custom-id')}>Dismiss</button>
    </div>
  );
};

describe('ToastProvider & useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders and auto-dismisses toast after duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const errorBtn = screen.getByText('Trigger Error');
    fireEvent.click(errorBtn);

    expect(screen.getByText('Lỗi 400')).toBeInTheDocument();
    expect(screen.getByText('Validation failed: invalid email')).toBeInTheDocument();

    // Fast-forward time past 5000ms
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Validation failed: invalid email')).not.toBeInTheDocument();
  });

  it('shows success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    const successBtn = screen.getByText('Trigger Success');
    fireEvent.click(successBtn);

    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(screen.getByText('Operation succeeded')).toBeInTheDocument();
  });
});
