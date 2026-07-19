import React from 'react';

type Opcode = 'text' | 'binary' | 'close' | 'ping' | 'pong' | 'continuation';

const OPCODES: Record<Opcode, { hex: string; label: string; color: string }> = {
  continuation: { hex: '0x0', label: 'Continuation', color: 'text-zinc-400 border-zinc-600 bg-zinc-800/40' },
  text:         { hex: '0x1', label: 'Text',         color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
  binary:       { hex: '0x2', label: 'Binary',       color: 'text-purple-400 border-purple-500/50 bg-purple-500/10' },
  close:        { hex: '0x8', label: 'Close',        color: 'text-red-400 border-red-500/50 bg-red-500/10' },
  ping:         { hex: '0x9', label: 'Ping',         color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' },
  pong:         { hex: '0xA', label: 'Pong',         color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
};

interface WsOpcodeBadgeProps {
  opcode: Opcode;
  showLabel?: boolean;
}

export default function WsOpcodeBadge({ opcode, showLabel = true }: WsOpcodeBadgeProps) {
  const { hex, label, color } = OPCODES[opcode];
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10.5px] border rounded px-1.5 py-0.5 ${color}`}>
      <span className="opacity-70">{hex}</span>
      {showLabel && <span className="font-medium">{label}</span>}
    </span>
  );
}

export type { Opcode };
