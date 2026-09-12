'use client';

import React from 'react';

export interface PushEvent {
  id: string;
  targetUserId: string;
  event: string;
  payload: string;
  ts: string;
  receivedBy: string[];
}

export interface WsPushEventLogProps {
  logs: PushEvent[];
}

export function WsPushEventLog({ logs }: WsPushEventLogProps) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Push history</p>
      <div className="space-y-1 font-mono text-[10.5px] max-h-28 overflow-y-auto">
        {logs.length === 0 ? (
          <span className="text-zinc-600">Chưa có push nào...</span>
        ) : (
          logs.map((e) => (
            <div key={e.id} className="text-zinc-600">
              <span className="text-zinc-500">[{e.ts}]</span>{' '}
              <span className="text-emerald-400">→ {e.targetUserId}</span>{' '}
              <span className="text-blue-300">&apos;{e.event}&apos;</span>{' '}
              <span className="text-zinc-500">({e.receivedBy.length} socket{e.receivedBy.length > 1 ? 's' : ''})</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WsPushEventLog;
