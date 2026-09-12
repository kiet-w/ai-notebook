'use client';

import React, { useState } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsChatWindow, { type FrameEvent } from '@/components/molecules/ws/WsChatWindow';
import WsBidirectionalControls, { type PresetItem } from '@/components/molecules/ws/WsBidirectionalControls';

function nowTs() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
}

let _idCounter = 0;
function nextId() { return String(++_idCounter); }

const PRESETS: PresetItem[] = [
  { label: 'mark-read',      payload: '{ noteId: 123 }', response: true,  responseEvent: 'ack',         responsePayload: '{ ok: true }' },
  { label: 'start-typing',   payload: '{}',              response: false },
  { label: 'get-ai-summary', payload: '{ noteId: 42 }',  response: true,  responseEvent: 'ai-response', responsePayload: '{ summary: "..." }' },
];

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

  function sendPreset(preset: PresetItem) {
    sendEvent(preset.label, preset.payload, preset.response, preset.responseEvent, preset.responsePayload);
  }

  function triggerServerPush() {
    setSending(true);
    setTimeout(() => {
      addFrame({ direction: 's2c', event: 'notification', payload: '{ msg: "Note shared with you" }' });
      setSending(false);
    }, 300);
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
          <WsBidirectionalControls
            presets={PRESETS}
            customEvent={customEvent}
            customPayload={customPayload}
            sending={sending}
            onCustomEventChange={setCustomEvent}
            onCustomPayloadChange={setCustomPayload}
            onSendPreset={sendPreset}
            onSendCustom={() => sendEvent(customEvent, customPayload, false)}
            onTriggerPush={triggerServerPush}
            onClear={() => setFrames([])}
          />
          <WsChatWindow frames={frames} />
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
