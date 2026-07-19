'use client';

import React, { useState, useCallback, useEffect } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsBitCell from '@/components/atoms/ws/WsBitCell';
import WsOpcodeBadge from '@/components/atoms/ws/WsOpcodeBadge';

// ── masking helpers ────────────────────────────────────────────────────────

function randomMaskKey(): Uint8Array {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return arr;
}

function xorMask(payload: Uint8Array, mask: Uint8Array): Uint8Array {
  return payload.map((byte, i) => byte ^ mask[i % 4]);
}

function toHexStr(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

// ── component ──────────────────────────────────────────────────────────────

/**
 * Interactive WebSocket Frame visualizer.
 * - Shows byte-level frame structure
 * - Live masking demo: user types message → see XOR masking applied
 */
export default function WsFrameDemo() {
  const [message, setMessage] = useState('Hello, WebSocket!');
  const [fromClient, setFromClient] = useState(true);
  
  // Use a stable initial value to prevent SSR hydration mismatch
  const [maskKey, setMaskKey] = useState<Uint8Array>(new Uint8Array(4));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setMaskKey(randomMaskKey());
    setIsMounted(true);
  }, []);

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
                className={`px-3 py-1.5 font-mono text-[11px] transition-colors ${fromClient ? 'bg-blue-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Client → Server
              </button>
              <button
                id="frame-dir-server"
                onClick={() => setFromClient(false)}
                className={`px-3 py-1.5 font-mono text-[11px] transition-colors ${!fromClient ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Server → Client
              </button>
            </div>
          </div>
        </div>

        {/* Frame structure diagram */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
            Cấu trúc frame (RFC 6455)
          </p>
          <div className="grid grid-cols-8 gap-1">
            {/* Byte 0 */}
            <WsBitCell label="FIN" detail="1 bit" variant="blue" value="1" />
            <WsBitCell label="RSV1" detail="1 bit" variant="gray" value="0" />
            <WsBitCell label="RSV2" detail="1 bit" variant="gray" value="0" />
            <WsBitCell label="RSV3" detail="1 bit" variant="gray" value="0" />
            <WsBitCell label="Opcode" detail="4 bits" bits={4} variant="purple" value="0x1 text" />
            {/* Byte 1 */}
            <WsBitCell
              label="MASK"
              detail="1 bit"
              variant={fromClient ? 'yellow' : 'gray'}
              value={fromClient ? '1' : '0'}
            />
            <WsBitCell label="Payload Len" detail="7 bits" bits={7} variant="green" value={lenDisplay} />
            {/* Extended len + mask key */}
            {payloadLen > 125 && (
              <WsBitCell
                label={payloadLen <= 65535 ? 'Ext Len (16-bit)' : 'Ext Len (64-bit)'}
                detail={payloadLen <= 65535 ? '2 bytes' : '8 bytes'}
                bits={8}
                variant="green"
                value={String(payloadLen)}
              />
            )}
            {fromClient && (
              <WsBitCell
                label="Masking Key"
                detail="4 bytes"
                bits={8}
                variant="orange"
                value={toHexStr(maskKey)}
              />
            )}
            <WsBitCell
              label="Payload Data"
              detail={`${payloadLen} bytes`}
              bits={8}
              variant={fromClient ? 'red' : 'blue'}
              value={fromClient
                ? toHexStr(maskedBytes).slice(0, 30) + (maskedBytes.length > 10 ? '…' : '')
                : toHexStr(payloadBytes).slice(0, 30) + (payloadBytes.length > 10 ? '…' : '')}
            />
          </div>
        </div>

        {/* Opcode table */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
            Các loại Opcode
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['text','binary','close','ping','pong'] as const).map((op) => (
              <WsOpcodeBadge key={op} opcode={op} />
            ))}
          </div>
        </div>

        {/* Masking demo */}
        <div className="rounded border border-orange-500/20 border-l-2 border-l-orange-400 bg-orange-500/[0.04] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-orange-400">
              {fromClient ? 'Masking Demo — Client → Server (bắt buộc)' : 'Không cần mask — Server → Client'}
            </p>
            {fromClient && (
              <button
                id="frame-regen-mask"
                onClick={regenerateMask}
                className="font-mono text-[10px] text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded px-2 py-0.5 transition-colors"
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
