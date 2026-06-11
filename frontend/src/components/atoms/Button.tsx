'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'nav' | 'ghost';
  isActive?: boolean;
}

export default function Button({ children, variant = 'primary', isActive, className = '', ...props }: ButtonProps) {
  let baseClass = '';
  
  if (variant === 'primary') {
    const hasPadding = /\bp[xy]?-/.test(className);
    baseClass = `inline-flex items-center justify-center gap-1.5 ${hasPadding ? '' : 'px-4 py-2'} bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(9,9,11,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] border border-zinc-900 dark:border-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:border-zinc-800 dark:hover:border-zinc-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer`;
  } else if (variant === 'nav') {
    baseClass = `w-full relative flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium rounded-lg border group cursor-pointer ${
      isActive
        ? 'bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-50 border-zinc-200/60 dark:border-zinc-850/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pl-[18px]'
        : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-zinc-200/35 dark:hover:bg-zinc-800/20 hover:text-zinc-900 dark:hover:text-zinc-100'
    }`;
  } else if (variant === 'ghost') {
    baseClass = 'w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 rounded-lg border border-transparent hover:bg-zinc-200/35 dark:hover:bg-zinc-800/20 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer';
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {variant === 'nav' && isActive && (
        <span className="absolute left-1.5 top-[25%] bottom-[25%] w-[2px] rounded-full bg-zinc-900 dark:bg-zinc-100" />
      )}
      {children}
    </button>
  );
}
