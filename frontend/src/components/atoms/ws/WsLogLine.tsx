import React from 'react';

type LogSrc = 'CLIENT' | 'SERVER' | 'PROXY' | 'SYSTEM' | 'ERROR';
type LogCls = 'ok' | 'bad' | 'warn' | 'dim' | 'default';

export interface LogEntry {
  id: string;
  ts: string;
  src: LogSrc;
  msg: string;
  cls?: LogCls;
}

interface WsLogLineProps {
  entry: LogEntry;
}

const srcClasses: Record<LogSrc, string> = {
  CLIENT: 'text-blue-400',
  SERVER: 'text-emerald-400',
  PROXY:  'text-yellow-400',
  SYSTEM: 'text-zinc-500',
  ERROR:  'text-red-400',
};

const msgClasses: Record<LogCls, string> = {
  ok:      'text-emerald-400',
  bad:     'text-red-400',
  warn:    'text-yellow-400',
  dim:     'text-zinc-600',
  default: 'text-zinc-300',
};

/**
 * Single line in the simulator log panel.
 */
export default function WsLogLine({ entry }: WsLogLineProps) {
  const cls = entry.cls ?? 'default';
  return (
    <div className="flex gap-2 py-0.5 animate-[fadeUp_0.25s_ease_forwards] font-mono text-[12px] leading-relaxed">
      <span className="text-zinc-600 flex-shrink-0">{entry.ts}</span>
      <span className={`w-14 flex-shrink-0 font-semibold ${srcClasses[entry.src]}`}>
        {entry.src}
      </span>
      <span className={`flex-1 break-all ${msgClasses[cls]}`}>{entry.msg}</span>
    </div>
  );
}

export type { LogSrc, LogCls };
