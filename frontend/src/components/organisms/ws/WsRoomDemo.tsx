'use client';

import React, { useState } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsRoomClientCard, { type SocketClient } from '@/components/molecules/ws/WsRoomClientCard';
import WsRoomLogs from '@/components/molecules/ws/WsRoomLogs';

const INITIAL_CLIENTS: SocketClient[] = [
  { id: 'socket_a1b2', userId: 'user-1', color: 'blue',    connected: false, joinedRoom: false },
  { id: 'socket_c3d4', userId: 'user-2', color: 'purple',  connected: false, joinedRoom: false },
  { id: 'socket_e5f6', userId: 'user-3', color: 'emerald', connected: false, joinedRoom: false },
  { id: 'socket_g7h8', userId: 'user-1', color: 'blue',    connected: false, joinedRoom: false },
];

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
                <WsRoomClientCard
                  key={c.id}
                  client={c}
                  onConnect={connect}
                  onDisconnect={disconnect}
                />
              ))}
            </div>
            <button
              id="room-reset"
              onClick={resetAll}
              className="mt-2 font-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
            >
              ↺ reset all
            </button>
          </div>

          {/* Right: Room map & Log */}
          <WsRoomLogs roomMap={roomMap} logs={log} />
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
