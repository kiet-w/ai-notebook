'use client';

import React from 'react';
import { toHexStr } from '@/utils/wsCrypto';

export interface WsFrameMaskingViewProps {
  fromClient: boolean;
  maskKey: Uint8Array;
  maskedBytes: Uint8Array;
  payloadBytes: Uint8Array;
  onRegenerateMask: () => void;
}

export function WsFrameMaskingView({
  fromClient,
  maskKey,
  maskedBytes,
  payloadBytes,
  onRegenerateMask,
}: WsFrameMaskingViewProps) {
  return (
    <div className="rounded border border-orange-500/20 border-l-2 border-l-orange-400 bg-orange-500/[0.04] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-orange-400">
          {fromClient ? 'Masking Demo — Client → Server (bắt buộc)' : 'Không cần mask — Server → Client'}
        </p>
        {fromClient && (
          <button
            id="frame-regen-mask"
            onClick={onRegenerateMask}
            className="font-mono text-[10px] text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded px-2 py-0.5 transition-colors cursor-pointer"
          >
            ↻ random mask
          </button>
        )}
      </div>

      {fromClient ? (
        <div className="font-mono text-[11px] leading-relaxed space-y-1">
          <div>
            <span className="text-zinc-600">original   : </span>
            <span className="text-blue-300">{toHexStr(payloadBytes).slice(0, 60)}{payloadBytes.length > 15 ? '…' : ''}</span>
          </div>
          <div>
            <span className="text-zinc-600">mask key   : </span>
            <span className="text-orange-300">{toHexStr(maskKey)}</span>
          </div>
          <div>
            <span className="text-zinc-600">masked     : </span>
            <span className="text-red-300">{toHexStr(maskedBytes).slice(0, 60)}{maskedBytes.length > 15 ? '…' : ''}</span>
          </div>
          <div className="text-zinc-600 text-[10px] pt-1">
            masked[i] = payload[i] XOR maskKey[i % 4]
          </div>
          <div className="text-zinc-600 text-[10px]">
            Mục đích: tránh proxy/cache hiểu nhầm WebSocket frame là HTTP response thông thường
          </div>
        </div>
      ) : (
        <p className="font-mono text-[11px] text-zinc-500">
          Server không cần mask — client là người nhận và parser frame là đã biết format.
        </p>
      )}
    </div>
  );
}

export default WsFrameMaskingView;
