'use client';

import React, { useState } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';

interface FrameEvent {
  id: string;
  direction: 'c2s' | 's2c';
  event: string;
  payload: string;
  ts: string;
  related?: string; // id of the frame this is responding to
}

function nowTs() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
}

let _idCounter = 0;
function nextId() { return String(++_idCounter); }

const PRESETS = [
  { label: 'mark-read',     payload: '{ noteId: 123 }',       response: true,  responseEvent: 'ack',          responsePayload: '{ ok: true }' },
  { label: 'start-typing',  payload: '{}',                    response: false },
  { label: 'get-ai-summary',payload: '{ noteId: 42 }',        response: true,  responseEvent: 'ai-response',  responsePayload: '{ summary: "..." }' },
];

/**
 * Phase 5 — Bidirectional messages demo.
 * Shows @SubscribeMessage handler and the full-duplex timeline.
 */
export default function WsBidirectionalDemo() {
  const [frames, setFrames] = useState<FrameEvent[]>([]);
  const [customEvent, setCustomEvent]   = useState('mark-read');
  const [customPayload, setCustomPayload] = useState('{ noteId: 123 }');
  const [sending, setSending] = useState(false);

  function addFrame(f: Omit<FrameEvent, 'id' | 'ts'>) {
    const frame: FrameEvent = { ...f, id: nextId(), ts: nowTs() };
    setFrames((prev) => [...prev, frame]);
    return frame.id;
  }

  function sendEvent(event: string, payload: string, withResponse: boolean, responseEvent?: string, responsePayload?: string) {
    if (sending) return;
    setSending(true);
    const id = addFrame({ direction: 'c2s', event, payload });

    if (withResponse && responseEvent) {
      setTimeout(() => {
        addFrame({ direction: 's2c', event: responseEvent, payload: responsePayload ?? '{}', related: id });
        setSending(false);
      }, 700);
    } else {
      setTimeout(() => setSending(false), 400);
    }
  }

  function sendPreset(preset: typeof PRESETS[0]) {
    sendEvent(preset.label, preset.payload, preset.response ?? false, preset.responseEvent, preset.responsePayload);
  }

  function triggerServerPush() {
    setSending(true);
    setTimeout(() => {
      addFrame({ direction: 's2c', event: 'notification', payload: '{ msg: "Note shared with you" }' });
      setSending(false);
    }, 300);
  }

  function clearFrames() {
    setFrames([]);
  }

  return (
    <WsCard title="ws-bidirectional — @SubscribeMessage + full-duplex timeline">
      <div className="p-4 flex flex-col gap-4">

        {/* Code */}
        <div className="rounded border border-white/[0.07] bg-zinc-950/60 p-3 font-mono text-[11px] leading-relaxed">
          <span className="text-zinc-600">{'// Server — lắng nghe từ client'}{'\n'}</span>
          <span className="text-purple-300">@SubscribeMessage</span>
          <span className="text-zinc-400">(</span>
          <span className="text-emerald-300">&apos;mark-read&apos;</span>
          <span className="text-zinc-400">){'\n'}</span>
          <span className="text-blue-300">handleMarkRead</span>
          <span className="text-zinc-400">(client: Socket, noteId: string) {'{'}{'\n'}</span>
          <span className="text-zinc-600">{'  // xử lý, rồi emit ngược lại nếu cần'}{'\n'}</span>
          <span className="text-zinc-600">{'  '}</span>
          <span className="text-yellow-300">client</span>
          <span className="text-zinc-400">.emit(</span>
          <span className="text-emerald-300">&apos;ack&apos;</span>
          <span className="text-zinc-400">, {'{ ok: true }'}){'\n'}</span>
          <span className="text-zinc-400">{'}'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Client → Server (preset)
              </p>
              <div className="flex flex-col gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    id={`bidi-preset-${p.label}`}
                    onClick={() => sendPreset(p)}
                    disabled={sending}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-blue-500/30 text-blue-300 text-left font-mono text-[11px] hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[.98]"
                  >
                    <span className="text-zinc-600">↑</span>
                    <span className="text-blue-300">&apos;{p.label}&apos;</span>
                    <span className="text-zinc-700 text-[10px]">{p.payload}</span>
                    {p.response && <span className="ml-auto text-[10px] text-emerald-400">→ ack</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Custom emit
              </p>
              <div className="flex flex-col gap-1.5">
                <input
                  id="bidi-custom-event"
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  placeholder="event name"
                  className="bg-zinc-800/60 border border-white/[0.08] rounded px-2 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
                />
                <input
                  id="bidi-custom-payload"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder="payload JSON"
                  className="bg-zinc-800/60 border border-white/[0.08] rounded px-2 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
                />
                <button
                  id="bidi-send-custom"
                  onClick={() => sendEvent(customEvent, customPayload, false)}
                  disabled={sending}
                  className="px-3 py-1.5 rounded font-mono text-[11px] font-medium bg-blue-500 text-zinc-950 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all"
                >
                  ↑ socket.emit(event)
                </button>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Server → Client (chủ động push)
              </p>
              <button
                id="bidi-server-push"
                onClick={triggerServerPush}
                disabled={sending}
                className="w-full px-3 py-1.5 rounded font-mono text-[11px] font-medium border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all"
              >
                ↓ server.emit(notification)
              </button>
            </div>

            <button
              id="bidi-clear"
              onClick={clearFrames}
              className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
            >
              ✕ clear timeline
            </button>
          </div>

          {/* Timeline */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
              Frame timeline — full-duplex
            </p>
            <div className="relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.05]" />

              <div className="flex flex-col gap-1.5 min-h-40">
                {frames.length === 0 ? (
                  <p className="font-mono text-[10.5px] text-zinc-700 text-center pt-8">
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
                          <div className="text-[9px] text-zinc-600 mb-0.5">CLIENT ↑  {f.ts}</div>
                          <div className="font-semibold">&apos;{f.event}&apos;</div>
                          <div className="text-[9.5px] text-zinc-500 break-all">{f.payload}</div>
                        </div>
                      ) : (
                        <div className="max-w-[46%] font-mono text-[10px] rounded border border-emerald-500/40 bg-emerald-500/[0.08] px-2 py-1.5 text-emerald-300 text-right">
                          <div className="text-[9px] text-zinc-600 mb-0.5">{f.ts}  ↓ SERVER</div>
                          <div className="font-semibold">&apos;{f.event}&apos;</div>
                          <div className="text-[9.5px] text-zinc-500 break-all">{f.payload}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-purple-500/20 border-l-2 border-l-purple-400 bg-purple-500/[0.04] px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
          <span className="text-purple-400 font-medium">SSE không có điều này:</span>{' '}
          SSE chỉ 1 chiều server → client. WebSocket cho phép client{' '}
          <span className="text-zinc-300 font-medium">gửi ngược lên qua cùng kết nối đó</span> —
          server nhận qua <code className="font-mono text-[11px] text-purple-300">@SubscribeMessage</code>{' '}
          như một route handler.
        </div>

      </div>
    </WsCard>
  );
}
