'use client';

import React from 'react';
import { cn, buttonVariants, type ButtonVariantProps } from '@/lib/ui-styles';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonVariantProps, 'fullWidth' | 'isActive'> {
  variant?: 'primary' | 'nav' | 'ghost' | 'outline';
  isActive?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isActive,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({
          variant,
          isActive: !!isActive,
          fullWidth: !!fullWidth,
        }),
        className
      )}
      {...props}
    >
      {variant === 'nav' && isActive && (
        <span className="absolute left-1.5 top-[25%] bottom-[25%] w-[2px] rounded-full bg-zinc-900 dark:bg-zinc-100" />
      )}
      {children}
    </button>
  );
}

export default Button;

