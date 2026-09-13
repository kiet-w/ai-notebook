import React from 'react';
import { cn } from '@/lib/ui-styles';

type HashVariant = 'key' | 'magic' | 'concat' | 'sha' | 'b64' | 'mismatch' | 'default';

interface WsHashValueProps {
  children: React.ReactNode;
  variant?: HashVariant;
  span?: boolean; // grid-column: span 3
  className?: string;
}

const variantClasses: Record<HashVariant, string> = {
  key:      'border-purple-500/50 bg-purple-500/10 text-purple-300',
  magic:    'border-orange-400/50 bg-orange-400/10 text-orange-300',
  concat:   'border-blue-500/50 bg-blue-500/10 text-blue-300',
  sha:      'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  b64:      'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  mismatch: 'border-red-500/50 bg-red-500/10 text-red-400',
  default:  'border-white/10 bg-white/[0.03] text-zinc-400',
};

/**
 * Monospace value box used inside the hash calculator visualizer.
 */
export default function WsHashValue({ children, variant = 'default', span = false, className }: WsHashValueProps) {
  return (
    <div
      className={cn(
        'font-mono text-[11px] px-2.5 py-1.5 rounded border break-all leading-relaxed min-h-[28px] transition-colors duration-300',
        variantClasses[variant],
        span && 'col-span-3',
        className
      )}
    >
      {children}
    </div>
  );
}

export type { HashVariant };

