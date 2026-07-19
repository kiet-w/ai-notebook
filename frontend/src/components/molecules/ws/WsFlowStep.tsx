import React from 'react';
import WsStepNum, { type StepState } from '@/components/atoms/ws/WsStepNum';

interface WsFlowStepProps {
  num: number;
  state?: StepState;
  label: string;
  visible?: boolean;
  children: React.ReactNode; // code block content
}

/**
 * One step in the WebSocket handshake flow diagram.
 * Combines a step number badge with a label and a monospace code preview.
 */
export default function WsFlowStep({ num, state = 'idle', label, visible = true, children }: WsFlowStepProps) {
  return (
    <div
      className={`grid grid-cols-[28px_1fr] gap-3 items-start transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5 pointer-events-none'
      }`}
    >
      <WsStepNum num={num} state={state} />
      <div>
        <p className="text-[13px] font-medium text-zinc-200 mb-1.5">{label}</p>
        <pre className="font-mono text-[11.5px] text-zinc-500 leading-relaxed whitespace-pre-wrap break-all">
          {children}
        </pre>
      </div>
    </div>
  );
}
