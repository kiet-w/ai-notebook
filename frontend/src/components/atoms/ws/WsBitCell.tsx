import React from 'react';

interface WsBitCellProps {
  label: string;     // short label shown inside
  detail?: string;   // tooltip-style detail below
  bits?: number;     // how many "units" wide (grid span)
  variant?: 'blue' | 'purple' | 'yellow' | 'green' | 'red' | 'gray' | 'orange';
  value?: string;    // live value to show
}

const variantClass: Record<string, string> = {
  blue:   'border-blue-500/50 bg-blue-500/10 text-blue-300',
  purple: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
  yellow: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  green:  'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  red:    'border-red-500/50 bg-red-500/10 text-red-300',
  gray:   'border-zinc-700 bg-zinc-800/60 text-zinc-500',
  orange: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
};

/**
 * A single labeled "bit field" cell in a WebSocket frame diagram.
 */
export default function WsBitCell({ label, detail, bits = 1, variant = 'gray', value }: WsBitCellProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border rounded px-1 py-1.5 min-h-[52px] ${variantClass[variant]}`}
      style={{ gridColumn: `span ${bits}` }}
    >
      <span className="font-mono text-[10px] font-semibold text-center leading-tight">{label}</span>
      {value !== undefined && (
        <span className="font-mono text-[9px] mt-0.5 opacity-80 break-all text-center">{value}</span>
      )}
      {detail && (
        <span className="text-[9px] mt-0.5 opacity-50 text-center leading-tight">{detail}</span>
      )}
    </div>
  );
}
