import React from 'react';
import { cn } from '@/lib/ui-styles';

interface WsBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Small monospace badge used in the WebSocket handshake demo page.
 * Styled to match the dark-tech aesthetic of the feature.
 */
export default function WsBadge({ children, className }: WsBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm border border-blue-500/60 bg-blue-500/10 text-blue-400 select-none',
        className
      )}
    >
      {children}
    </span>
  );
}

