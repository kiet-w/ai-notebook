'use client';

import React from 'react';
import { SocketClient } from './WsRoomClientCard';

export const USER_COLORS: Record<string, { dot: string; badge: string }> = {
  'user-1': { dot: 'bg-blue-400',    badge: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
  'user-2': { dot: 'bg-purple-400',  badge: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
  'user-3': { dot: 'bg-emerald-400', badge: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
};

export interface WsRoomLogsProps {
  roomMap: Record<string, SocketClient[]>;
  logs: string[];
}

export function WsRoomLogs({ roomMap, logs }: WsRoomLogsProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
        Internal Room Map {'{ room: Set<socketId> }'}
      </p>
      <div className="rounded border border-white/[0.07] bg-zinc-950/60 p-2.5 font-mono text-[11px] min-h-28">
        {Object.keys(roomMap).length === 0 ? (
          <span className="text-zinc-600">{'// empty — no sockets joined yet'}</span>
        ) : (
          Object.entries(roomMap).map(([room, sockets]) => (
            <div key={room} className="mb-1.5">
              <span className="text-zinc-600">&apos;</span>
              <span className={`font-medium ${USER_COLORS[room]?.badge || ''} border rounded px-1`}>
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
        {logs.map((l, i) => (
          <div key={i} className="text-zinc-600">
            <span className="text-zinc-500">▸ </span>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WsRoomLogs;
