'use client';

import React, { forwardRef } from 'react';
import { cn, inputVariants } from '@/lib/ui-styles';

export type InputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Input = forwardRef<HTMLTextAreaElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        inputVariants({ variant: 'textarea' }),
        'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
export default Input;

