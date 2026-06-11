'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'nav' | 'ghost';
  isActive?: boolean;
}

export default function Button({ children, variant = 'primary', isActive, className = '', ...props }: ButtonProps) {
  let baseClass = '';
  if (variant === 'primary') {
    baseClass = 'p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed';
  } else if (variant === 'nav') {
    baseClass = `w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded transition-colors group ${
      isActive
        ? 'bg-hover text-foreground'
        : 'text-secondary-text hover:bg-hover hover:text-foreground'
    }`;
  } else if (variant === 'ghost') {
    baseClass = 'w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-secondary-text rounded hover:bg-hover hover:text-foreground transition-colors';
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
