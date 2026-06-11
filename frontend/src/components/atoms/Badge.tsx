import React from 'react';

interface BadgeProps {
  icon?: string;
  text: string;
  className?: string;
}

export default function Badge({ icon, text, className = '' }: BadgeProps) {
  return (
    <span className={`shrink-0 text-[10px] bg-zinc-150/40 dark:bg-zinc-800/45 border border-zinc-200/40 dark:border-zinc-800/30 px-2 py-0.5 rounded-full flex items-center gap-1 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${className}`}>
      {icon && (
        <span role="img" aria-label={text} className="text-[11px] leading-none">
          {icon}
        </span>
      )}
      <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider leading-none">
        {text}
      </span>
    </span>
  );
}
