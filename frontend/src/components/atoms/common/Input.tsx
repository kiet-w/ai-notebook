'use client';

import React, { forwardRef } from 'react';

export type InputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Input = forwardRef<HTMLTextAreaElement, InputProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 bg-transparent border-none focus:ring-0 resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[52px] max-h-[300px] overflow-y-auto ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
export default Input;
