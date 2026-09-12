'use client';

import React, { useState, useCallback } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import { randomMaskKey, xorMask } from '@/utils/wsCrypto';
import WsFrameHeaderTable from '@/components/molecules/ws/WsFrameHeaderTable';
import WsFrameMaskingView from '@/components/molecules/ws/WsFrameMaskingView';

export default function WsFrameDemo() {
  const [message, setMessage] = useState('Hello, WebSocket!');
  const [fromClient, setFromClient] = useState(true);
  
  const [maskKey, setMaskKey] = useState<Uint8Array>(() => new Uint8Array([0x37, 0xfa, 0x21, 0x3d]));

  const payloadBytes = new TextEncoder().encode(message);
  const maskedBytes  = fromClient ? xorMask(payloadBytes, maskKey) : payloadBytes;

  const payloadLen = payloadBytes.length;
  const lenDisplay =
    payloadLen <= 125 ? `${payloadLen} (7-bit)` :
    payloadLen <= 65535 ? `${payloadLen} (16-bit ext)` :
    `${payloadLen} (64-bit ext)`;

  const regenerateMask = useCallback(() => setMaskKey(randomMaskKey()), []);

  return (
    <WsCard title="ws-frame-visualizer">
      <div className="p-4 flex flex-col gap-5">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
              Payload message
            </label>
            <input
              id="frame-message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
              className="w-full bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 font-mono text-[12px] text-zinc-300 outline-none focus:border-blue-500/50 transition-colors"
              placeholder="Type a message..."
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
              Direction
            </label>
            <div className="flex rounded overflow-hidden border border-white/[0.08]">
              <button
                id="frame-dir-client"
                onClick={() => setFromClient(true)}
                className={`px-3 py-1.5 font-mono text-[11px] transition-colors cursor-pointer ${fromClient ? 'bg-blue-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Client → Server
              </button>
              <button
                id="frame-dir-server"
                onClick={() => setFromClient(false)}
                className={`px-3 py-1.5 font-mono text-[11px] transition-colors cursor-pointer ${!fromClient ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Server → Client
              </button>
            </div>
          </div>
        </div>

        {/* Frame structure & opcodes */}
        <WsFrameHeaderTable
          fromClient={fromClient}
          payloadLen={payloadLen}
          lenDisplay={lenDisplay}
          maskKey={maskKey}
          maskedBytes={maskedBytes}
          payloadBytes={payloadBytes}
        />

        {/* Masking demo */}
        <WsFrameMaskingView
          fromClient={fromClient}
          maskKey={maskKey}
          maskedBytes={maskedBytes}
          payloadBytes={payloadBytes}
          onRegenerateMask={regenerateMask}
        />

        {/* Full duplex note */}
        <div className="rounded border border-blue-500/20 border-l-2 border-l-blue-400 bg-blue-500/[0.04] px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
          <span className="text-blue-400 font-medium">Full-duplex:</span>{' '}
          Không còn khái niệm request-response. Sau handshake, bất kỳ bên nào
          cũng có thể gửi frame <span className="text-zinc-300 font-medium">bất cứ lúc nào</span>,
          không cần chờ được hỏi. Server có thể push 3 frame liên tiếp dù client chưa gửi gì.
        </div>
      </div>
    </WsCard>
  );
}
