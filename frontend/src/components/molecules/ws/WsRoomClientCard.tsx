'use client';

import React from 'react';

export interface SocketClient {
  id: string;
  userId: string;
  color: string;
  connected: boolean;
  joinedRoom: boolean;
}

export const SOCKET_COLOR: Record<string, string> = {
  'user-1': 'border-blue-500/60 bg-blue-500/10 text-blue-300',
  'user-2': 'border-purple-500/60 bg-purple-500/10 text-purple-300',
  'user-3': 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
};

export interface WsRoomClientCardProps {
  client: SocketClient;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export function WsRoomClientCard({
  client,
  onConnect,
  onDisconnect,
}: WsRoomClientCardProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded border px-2.5 py-2 transition-all duration-300 ${
        SOCKET_COLOR[client.userId]
      } ${client.connected ? 'opacity-100' : 'opacity-40'}`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
          client.connected ? `bg-${client.color}-400` : 'bg-zinc-600'
        }`}
        style={{ background: client.connected ? undefined : '#52525b' }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] font-medium">{client.id}</div>
        <div className="font-mono text-[10px] opacity-60">
          userId: {client.userId}
          {client.joinedRoom && (
            <span className="ml-1.5 text-emerald-400">✓ joined room</span>
          )}
        </div>
      </div>
      {!client.connected ? (
        <button
          id={`room-connect-${client.id}`}
          onClick={() => onConnect(client.id)}
          className="font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex-shrink-0 cursor-pointer"
        >
          connect
        </button>
      ) : (
        <button
          id={`room-disconnect-${client.id}`}
          onClick={() => onDisconnect(client.id)}
          className="font-mono text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 cursor-pointer"
        >
          disconnect
        </button>
      )}
    </div>
  );
}

export default WsRoomClientCard;
