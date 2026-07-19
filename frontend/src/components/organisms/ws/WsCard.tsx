import React from 'react';

/** Card frame shared by all ws-demo organisms */
export default function WsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
      {/* macOS-style header */}
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        <span className="font-mono text-[11px] text-zinc-600 ml-2">{title}</span>
      </div>
      {children}
    </div>
  );
}
