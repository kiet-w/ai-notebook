'use client';

import React, { useState } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';

interface User {
  id: string;
  label: string;
  colorClass: string;
  dotColor: string;
}

interface PushEvent {
  id: string;
  targetUserId: string;
  event: string;
  payload: string;
  ts: string;
  receivedBy: string[];
}

const USERS: User[] = [
  { id: 'user-1', label: 'User #1 (2 tabs)', colorClass: 'border-blue-500/50 bg-blue-500/[0.07] text-blue-300',    dotColor: 'bg-blue-400' },
  { id: 'user-2', label: 'User #2 (1 tab)',  colorClass: 'border-purple-500/50 bg-purple-500/[0.07] text-purple-300', dotColor: 'bg-purple-400' },
  { id: 'user-3', label: 'User #3 (1 tab)',  colorClass: 'border-emerald-500/50 bg-emerald-500/[0.07] text-emerald-300', dotColor: 'bg-emerald-400' },
];

const SOCKETS: Record<string, string[]> = {
  'user-1': ['socket_a1b2', 'socket_g7h8'],
  'user-2': ['socket_c3d4'],
  'user-3': ['socket_e5f6'],
};

const EVENTS = ['note-created', 'note-updated', 'ai-response', 'notification'];

function nowTs() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
}

/**
 * Phase 4 — Server push demo.
 * Visualizes server.to(room).emit() delivering frames to the right sockets only.
 */
export default function WsPushDemo() {
  const [targetUserId, setTargetUserId] = useState('user-1');
  const [eventName, setEventName]       = useState('note-created');
  const [payload, setPayload]           = useState('{ "id": 42, "title": "New note" }');
  const [pushLog, setPushLog]           = useState<PushEvent[]>([]);
  const [highlighted, setHighlighted]   = useState<string[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);

  function emit() {
    if (broadcasting) return;
    setBroadcasting(true);
    const receivers = SOCKETS[targetUserId] ?? [];

    // Animate highlight after short delay
    setTimeout(() => {
      setHighlighted(receivers);
      const entry: PushEvent = {
        id:         String(Date.now()),
        targetUserId,
        event:      eventName,
        payload,
        ts:         nowTs(),
        receivedBy: receivers,
      };
      setPushLog((prev) => [entry, ...prev].slice(0, 6));
    }, 400);

    setTimeout(() => {
      setHighlighted([]);
      setBroadcasting(false);
    }, 1800);
  }

  return (
    <WsCard title="ws-push-demo — server.to(room).emit()">
      <div className="p-4 flex flex-col gap-4">

        {/* Code */}
        <div className="rounded border border-white/[0.07] bg-zinc-950/60 p-3 font-mono text-[11.5px] leading-relaxed">
          <span className="text-yellow-300">this</span>
          <span className="text-zinc-400">.server</span>
          <span className="text-zinc-400">.to(</span>
          <span className="text-emerald-300">{`\`user-\${userId}\``}</span>
          <span className="text-zinc-400">)</span>
          <span className="text-zinc-400">.emit(</span>
          <span className="text-blue-300">&apos;{eventName}&apos;</span>
          <span className="text-zinc-400">, note){'\n'}</span>
          <span className="text-zinc-600">{'// Chỉ gửi tới sockets trong room "user-X", không broadcast toàn bộ'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
                Target User (room)
              </label>
              <div className="flex flex-col gap-1">
                {USERS.map((u) => (
                  <button
                    key={u.id}
                    id={`push-target-${u.id}`}
                    onClick={() => setTargetUserId(u.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left transition-all font-mono text-[11px] ${
                      targetUserId === u.id
                        ? u.colorClass
                        : 'border-white/[0.06] text-zinc-500 hover:border-white/[0.12]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${targetUserId === u.id ? u.dotColor : 'bg-zinc-600'}`} />
                    {u.label}
                    <span className="ml-auto opacity-60 text-[10px]">
                      {SOCKETS[u.id].length} socket{SOCKETS[u.id].length > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
                Event name
              </label>
              <select
                id="push-event-select"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
              >
                {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
                Payload
              </label>
              <input
                id="push-payload-input"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              id="push-emit-btn"
              onClick={emit}
              disabled={broadcasting}
              className="px-4 py-2 rounded font-mono text-[11px] font-medium bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.97] transition-all"
            >
              {broadcasting ? '⟳ Emitting...' : '▶ server.to(room).emit()'}
            </button>
          </div>

          {/* Visualization */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
              Socket delivery visualization
            </p>
            <div className="flex flex-col gap-1.5">
              {USERS.map((u) => (
                <div key={u.id}>
                  <div className={`text-[10px] font-mono mb-0.5 ${targetUserId === u.id && broadcasting ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    room &quot;{u.id}&quot;
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {SOCKETS[u.id].map((sid) => {
                      const isReceiving = highlighted.includes(sid);
                      return (
                        <div
                          key={sid}
                          className={`font-mono text-[10px] px-2 py-1 rounded border transition-all duration-300 ${
                            isReceiving
                              ? u.colorClass + ' shadow-sm scale-105'
                              : 'border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {isReceiving && <span className="mr-1">📨</span>}
                          {sid}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Push log */}
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Push history</p>
              <div className="space-y-1 font-mono text-[10.5px] max-h-28 overflow-y-auto">
                {pushLog.length === 0 ? (
                  <span className="text-zinc-700">Chưa có push nào...</span>
                ) : (
                  pushLog.map((e) => (
                    <div key={e.id} className="text-zinc-600">
                      <span className="text-zinc-700">[{e.ts}]</span>{' '}
                      <span className="text-emerald-400">→ {e.targetUserId}</span>{' '}
                      <span className="text-blue-300">&apos;{e.event}&apos;</span>{' '}
                      <span className="text-zinc-700">({e.receivedBy.length} socket{e.receivedBy.length > 1 ? 's' : ''})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-emerald-500/20 border-l-2 border-l-emerald-400 bg-emerald-500/[0.04] px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
          <span className="text-emerald-400 font-medium">Server push:</span>{' '}
          Hàm này có thể được gọi <span className="text-zinc-300 font-medium">bất cứ lúc nào</span> từ service
          khác (ngay sau khi DB lưu xong) — không cần client gửi request nào cả.
          Đây chính là <span className="text-zinc-300 font-medium">real-time push</span> thật sự.
        </div>

      </div>
    </WsCard>
  );
}
