import React from 'react';
import WsHashValue, { type HashVariant } from '@/components/atoms/ws/WsHashValue';

interface WsHashRowProps {
  label: string;
  /** If provided, renders two values side-by-side with a '+' separator */
  leftValue?: string;
  leftVariant?: HashVariant;
  rightValue?: string;
  rightVariant?: HashVariant;
  /** If provided, renders a single full-width value */
  fullValue?: string;
  fullVariant?: HashVariant;
}

/**
 * One row in the hash calculator visualizer.
 * Either two columns (KEY + MAGIC) or a single spanning column.
 */
export default function WsHashRow({
  label,
  leftValue, leftVariant = 'default',
  rightValue, rightVariant = 'default',
  fullValue, fullVariant = 'default',
}: WsHashRowProps) {
  return (
    <div className="grid grid-cols-[80px_1fr_20px_1fr] gap-1.5 items-center font-mono text-[11px]">
      <div className="text-right text-zinc-600 text-[10px] uppercase tracking-wider">{label}</div>
      {fullValue !== undefined ? (
        <WsHashValue variant={fullVariant} span>
          {fullValue}
        </WsHashValue>
      ) : (
        <>
          <WsHashValue variant={leftVariant}>{leftValue ?? ''}</WsHashValue>
          <div className="text-center text-zinc-600">+</div>
          <WsHashValue variant={rightVariant}>{rightValue ?? ''}</WsHashValue>
        </>
      )}
    </div>
  );
}
