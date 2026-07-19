'use client';

import React, { useState } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';

// ── types ──────────────────────────────────────────────────────────────────

interface SocketClient {
  id: string;
  userId: string;
  color: string;
  connected: boolean;
  joinedRoom: boolean;
}

const SOCKET_COLOR: Record<string, string> = {
  'user-1': 'border-blue-500/60 bg-blue-500/10 text-blue-300',
  'user-2': 'border-purple-500/60 bg-purple-500/10 text-purple-300',
  'user-3': 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
};

const INITIAL_CLIENTS: SocketClient[] = [
  { id: 'socket_a1b2', userId: 'user-1', color: 'blue',    connected: false, joinedRoom: false },
  { id: 'socket_c3d4', userId: 'user-2', color: 'purple',  connected: false, joinedRoom: false },
  { id: 'socket_e5f6', userId: 'user-3', color: 'emerald', connected: false, joinedRoom: false },
  { id: 'socket_g7h8', userId: 'user-1', color: 'blue',    connected: false, joinedRoom: false }, // second tab same user
];

const USER_COLORS: Record<string, { dot: string; badge: string }> = {
  'user-1': { dot: 'bg-blue-400',    badge: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
  'user-2': { dot: 'bg-purple-400',  badge: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
  'user-3': { dot: 'bg-emerald-400', badge: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
};

/**
 * Phase 3 — client.join() room demo.
 * Shows sockets connecting and joining rooms, with the internal room map.
 */
export default function WsRoomDemo() {
  const [clients, setClients] = useState<SocketClient[]>(INITIAL_CLIENTS);
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((prev) => [...prev.slice(-8), msg]);
  }

  function connect(id: string) {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: true } : c)),
    );
    const c = clients.find((x) => x.id === id)!;
    addLog(`socket ${id} connected`);
    setTimeout(() => {
      setClients((prev) =>
        prev.map((x) => (x.id === id ? { ...x, joinedRoom: true } : x)),
      );
      addLog(`getUserIdFromToken() → ${c.userId}`);
      addLog(`${id}.join("${c.userId}") ✓`);
    }, 600);
  }

  function disconnect(id: string) {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: false, joinedRoom: false } : c)),
    );
    addLog(`socket ${id} disconnected → removed from room`);
  }

  function resetAll() {
    setClients(INITIAL_CLIENTS);
    setLog([]);
  }

  // Build room map from current state
  const roomMap: Record<string, SocketClient[]> = {};
  clients
    .filter((c) => c.joinedRoom)
    .forEach((c) => {
      if (!roomMap[c.userId]) roomMap[c.userId] = [];
      roomMap[c.userId].push(c);
    });

  return (
    <WsCard title="ws-room-demo — client.join()">
      <div className="p-4 flex flex-col gap-4">

        {/* Code snippet */}
        <div className="rounded border border-white/[0.07] bg-zinc-950/60 p-3 font-mono text-[11.5px] leading-relaxed">
          <span className="text-zinc-600">{'// NestJS Gateway — handleConnection'}{'\n'}</span>
          <span className="text-purple-300">handleConnection</span>
          <span className="text-zinc-400">{'(client: Socket) {'}{'\n'}</span>
          <span className="text-zinc-600">{'  '}</span>
          <span className="text-blue-400">const</span>
          <span className="text-zinc-400">{' userId = '}</span>
          <span className="text-yellow-300">this</span>
          <span className="text-zinc-400">.getUserIdFromToken(</span>
          <span className="text-yellow-300">client</span>
          <span className="text-zinc-400">.handshake.query.token){'\n'}</span>
          <span className="text-zinc-600">{'  '}</span>
          <span className="text-yellow-300">client</span>
          <span className="text-zinc-400">.join(</span>
          <span className="text-emerald-300">{"`user-${'$'}{userId}`"}</span>
          <span className="text-zinc-400">){'\n'}</span>
          <span className="text-zinc-400">{'}'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left: Socket list */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
              Clients — nhấn để connect/disconnect
            </p>
            <div className="flex flex-col gap-1.5">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 rounded border px-2.5 py-2 transition-all duration-300 ${
                    SOCKET_COLOR[c.userId]
                  } ${c.connected ? 'opacity-100' : 'opacity-40'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                      c.connected ? `bg-${c.color}-400` : 'bg-zinc-600'
                    }`}
                    style={{ background: c.connected ? undefined : '#52525b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11px] font-medium">{c.id}</div>
                    <div className="font-mono text-[10px] opacity-60">
                      userId: {c.userId}
                      {c.joinedRoom && (
                        <span className="ml-1.5 text-emerald-400">✓ joined room</span>
                      )}
                    </div>
                  </div>
                  {!c.connected ? (
                    <button
                      id={`room-connect-${c.id}`}
                      onClick={() => connect(c.id)}
                      className="font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex-shrink-0"
                    >
                      connect
                    </button>
                  ) : (
                    <button
                      id={`room-disconnect-${c.id}`}
                      onClick={() => disconnect(c.id)}
                      className="font-mono text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      disconnect
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              id="room-reset"
              onClick={resetAll}
              className="mt-2 font-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ↺ reset all
            </button>
          </div>

          {/* Right: Room map */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
              Internal Room Map {'{ room: Set<socketId> }'}
            </p>
            <div className="rounded border border-white/[0.07] bg-zinc-950/60 p-2.5 font-mono text-[11px] min-h-28">
              {Object.keys(roomMap).length === 0 ? (
                <span className="text-zinc-700">{'// empty — no sockets joined yet'}</span>
              ) : (
                Object.entries(roomMap).map(([room, sockets]) => (
                  <div key={room} className="mb-1.5">
                    <span className="text-zinc-600">&apos;</span>
                    <span className={`font-medium ${USER_COLORS[room].badge} border rounded px-1`}>
                      {room}
                    </span>
                    <span className="text-zinc-600">&apos; → Set {'{'} </span>
                    {sockets.map((s, i) => (
                      <span key={s.id}>
                        <span className="text-yellow-300">&apos;{s.id}&apos;</span>
                        {i < sockets.length - 1 && <span className="text-zinc-600">, </span>}
                      </span>
                    ))}
                    <span className="text-zinc-600">{' }'}</span>
                  </div>
                ))
              )}
            </div>

            {/* Log */}
            <div className="mt-2 font-mono text-[10.5px] space-y-0.5 min-h-16">
              {log.map((l, i) => (
                <div key={i} className="text-zinc-600">
                  <span className="text-zinc-700">▸ </span>{l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded border border-blue-500/20 border-l-2 border-l-blue-400 bg-blue-500/[0.04] px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
          <span className="text-blue-400 font-medium">Key insight:</span>{' '}
          1 user có thể có <span className="text-zinc-300 font-medium">nhiều socket</span> (nhiều tab/device) —
          tất cả đều join cùng 1 room. Khi server emit tới room đó,{' '}
          <span className="text-zinc-300 font-medium">tất cả tab của user đó đều nhận được</span>.
        </div>

      </div>
    </WsCard>
  );
}
