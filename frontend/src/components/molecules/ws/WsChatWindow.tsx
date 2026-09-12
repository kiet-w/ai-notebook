'use client';

import React from 'react';

export interface FrameEvent {
  id: string;
  direction: 'c2s' | 's2c';
  event: string;
  payload: string;
  ts: string;
  related?: string;
}

export interface WsChatWindowProps {
  frames: FrameEvent[];
}

export function WsChatWindow({ frames }: WsChatWindowProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
        Frame timeline — full-duplex
      </p>
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.05]" />

        <div className="flex flex-col gap-1.5 min-h-40">
          {frames.length === 0 ? (
            <p className="font-mono text-[10.5px] text-zinc-600 text-center pt-8">
              Gửi event để xem timeline...
            </p>
          ) : (
            frames.map((f) => (
              <div
                key={f.id}
                className={`flex items-start gap-2 animate-[fadeUp_0.2s_ease_forwards] ${
                  f.direction === 'c2s' ? 'justify-start' : 'justify-end'
                }`}
              >
                {f.direction === 'c2s' ? (
                  <div className="max-w-[46%] font-mono text-[10px] rounded border border-blue-500/40 bg-blue-500/[0.08] px-2 py-1.5 text-blue-300">
                    <div className="text-[9px] text-zinc-500 mb-0.5">CLIENT ↑  {f.ts}</div>
                    <div className="font-semibold">&apos;{f.event}&apos;</div>
                    <div className="text-[9.5px] text-zinc-400 break-all">{f.payload}</div>
                  </div>
                ) : (
                  <div className="max-w-[46%] font-mono text-[10px] rounded border border-emerald-500/40 bg-emerald-500/[0.08] px-2 py-1.5 text-emerald-300 text-right">
                    <div className="text-[9px] text-zinc-500 mb-0.5">{f.ts}  ↓ SERVER</div>
                    <div className="font-semibold">&apos;{f.event}&apos;</div>
                    <div className="text-[9.5px] text-zinc-400 break-all">{f.payload}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default WsChatWindow;
