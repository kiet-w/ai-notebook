'use client';

import React from 'react';
import WsLogLine, { type LogEntry } from '@/components/atoms/ws/WsLogLine';

export interface SimResult {
  icon: '✅' | '❌';
  title: string;
  sub: string;
  ok: boolean;
}

export interface WsSimulatorLogsProps {
  logs: LogEntry[];
  result: SimResult | null;
  logWrapRef: React.RefObject<HTMLDivElement | null>;
}

export function WsSimulatorLogs({ logs, result, logWrapRef }: WsSimulatorLogsProps) {
  return (
    <>
      <div
        ref={logWrapRef}
        className="px-3.5 py-3 min-h-72 max-h-96 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <div className="font-mono text-[11px] text-zinc-600">
            Simulator ready. Nhấn &quot;Connect&quot; để bắt đầu.
          </div>
        ) : (
          logs.map((entry) => <WsLogLine key={entry.id} entry={entry} />)
        )}
      </div>

      {result && (
        <div className="flex flex-col items-center gap-2 py-4 border-t border-white/[0.06]">
          <div className="text-3xl">{result.icon}</div>
          <div
            className={`text-sm font-semibold ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {result.title}
          </div>
          <div className="font-mono text-[10.5px] text-zinc-500">{result.sub}</div>
        </div>
      )}
    </>
  );
}

export default WsSimulatorLogs;
