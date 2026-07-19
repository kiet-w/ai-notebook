'use client';

import React from 'react';

interface WsStatusBarProps {
  state: 'idle' | 'running' | 'ok' | 'error';
  message: string;
}

const dotClasses: Record<WsStatusBarProps['state'], string> = {
  idle:    'bg-zinc-600',
  running: 'bg-blue-400 shadow-[0_0_6px_theme(colors.blue.400)] animate-pulse',
  ok:      'bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]',
  error:   'bg-red-400 shadow-[0_0_6px_theme(colors.red.400)]',
};

const txtClasses: Record<WsStatusBarProps['state'], string> = {
  idle:    'text-zinc-600',
  running: 'text-blue-400',
  ok:      'text-emerald-400',
  error:   'text-red-400',
};

/**
 * Status indicator bar shown at the bottom of the simulator card.
 */
export default function WsStatusBar({ state, message }: WsStatusBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.06] bg-white/[0.01] font-mono text-[11px]">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${dotClasses[state]}`} />
      <span className={`transition-colors duration-300 ${txtClasses[state]}`}>{message}</span>
    </div>
  );
}
