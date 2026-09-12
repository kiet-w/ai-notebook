'use client';

import React from 'react';

export interface UserTarget {
  id: string;
  label: string;
  colorClass: string;
  dotColor: string;
}

export interface WsPushTargetsProps {
  users: UserTarget[];
  sockets: Record<string, string[]>;
  targetUserId: string;
  highlighted: string[];
  broadcasting: boolean;
}

export function WsPushTargets({
  users,
  sockets,
  targetUserId,
  highlighted,
  broadcasting,
}: WsPushTargetsProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
        Socket delivery visualization
      </p>
      <div className="flex flex-col gap-1.5">
        {users.map((u) => (
          <div key={u.id}>
            <div className={`text-[10px] font-mono mb-0.5 ${targetUserId === u.id && broadcasting ? 'text-zinc-300' : 'text-zinc-600'}`}>
              room &quot;{u.id}&quot;
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {sockets[u.id].map((sid) => {
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
    </div>
  );
}

export default WsPushTargets;
