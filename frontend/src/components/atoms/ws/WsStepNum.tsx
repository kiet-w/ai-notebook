import React from 'react';
import { cn } from '@/lib/ui-styles';

type StepState = 'idle' | 'ok' | 'bad' | 'warn';

interface WsStepNumProps {
  num: number;
  state?: StepState;
}

const stateClasses: Record<StepState, string> = {
  idle: 'border-blue-500/60 bg-blue-500/10 text-blue-400',
  ok:   'border-emerald-500/70 bg-emerald-500/10 text-emerald-400',
  bad:  'border-red-500/70 bg-red-500/10 text-red-400',
  warn: 'border-yellow-500/70 bg-yellow-500/10 text-yellow-400',
};

/**
 * Circular step number badge for the handshake flow diagram.
 */
export default function WsStepNum({ num, state = 'idle' }: WsStepNumProps) {
  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] font-mono text-[11px] font-bold transition-colors duration-300',
        stateClasses[state]
      )}
    >
      {num}
    </div>
  );
}

export type { StepState };

