'use client';

import React from 'react';

export interface WsSimulatorControlsProps {
  running: boolean;
  onConnect: () => void;
  onProxyAttack: () => void;
  onClear: () => void;
}

export function WsSimulatorControls({
  running,
  onConnect,
  onProxyAttack,
  onClear,
}: WsSimulatorControlsProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2 px-3.5 py-2.5 border-b border-white/[0.06]">
        <button
          id="ws-sim-connect"
          disabled={running}
          onClick={onConnect}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-medium bg-blue-500 text-zinc-950 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all cursor-pointer"
        >
          ▶ Connect (Normal)
        </button>

        <button
          id="ws-sim-proxy"
          disabled={running}
          onClick={onProxyAttack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-medium border border-red-500/60 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all cursor-pointer"
        >
          ⚡ Simulate Proxy Attack
        </button>

        <button
          id="ws-sim-clear"
          onClick={onClear}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] border border-white/[0.08] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all cursor-pointer"
        >
          ✕ Clear
        </button>
      </div>

      <div className="h-[2px] bg-white/[0.04] overflow-hidden">
        {running && (
          <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[connectorScan_1.8s_linear_infinite]" />
        )}
      </div>
    </>
  );
}

export default WsSimulatorControls;
