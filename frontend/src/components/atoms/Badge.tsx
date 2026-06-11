import React from 'react';

interface BadgeProps {
  icon?: string;
  text: string;
  className?: string;
}

export default function Badge({ icon, text, className = '' }: BadgeProps) {
  return (
    <span className={`shrink-0 text-xs bg-sidebar border border-border px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${className}`}>
      {icon && (
        <span role="img" aria-label={text} className="text-sm">
          {icon}
        </span>
      )}
      <span className="font-semibold text-foreground/70 uppercase tracking-tight">
        {text}
      </span>
    </span>
  );
}
