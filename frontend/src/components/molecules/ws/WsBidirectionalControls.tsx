'use client';

import React from 'react';

export interface PresetItem {
  label: string;
  payload: string;
  response: boolean;
  responseEvent?: string;
  responsePayload?: string;
}

export interface WsBidirectionalControlsProps {
  presets: PresetItem[];
  customEvent: string;
  customPayload: string;
  sending: boolean;
  onCustomEventChange: (val: string) => void;
  onCustomPayloadChange: (val: string) => void;
  onSendPreset: (preset: PresetItem) => void;
  onSendCustom: () => void;
  onTriggerPush: () => void;
  onClear: () => void;
}

export function WsBidirectionalControls({
  presets,
  customEvent,
  customPayload,
  sending,
  onCustomEventChange,
  onCustomPayloadChange,
  onSendPreset,
  onSendCustom,
  onTriggerPush,
  onClear,
}: WsBidirectionalControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Client → Server (preset)
        </p>
        <div className="flex flex-col gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              id={`bidi-preset-${p.label}`}
              onClick={() => onSendPreset(p)}
              disabled={sending}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-blue-500/30 text-blue-300 text-left font-mono text-[11px] hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[.98] cursor-pointer"
            >
              <span className="text-zinc-600">↑</span>
              <span className="text-blue-300">&apos;{p.label}&apos;</span>
              <span className="text-zinc-600 text-[10px]">{p.payload}</span>
              {p.response && <span className="ml-auto text-[10px] text-emerald-400">→ ack</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Custom emit
        </p>
        <div className="flex flex-col gap-1.5">
          <input
            id="bidi-custom-event"
            value={customEvent}
            onChange={(e) => onCustomEventChange(e.target.value)}
            placeholder="event name"
            className="bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
          />
          <input
            id="bidi-custom-payload"
            value={customPayload}
            onChange={(e) => onCustomPayloadChange(e.target.value)}
            placeholder="payload JSON"
            className="bg-zinc-800/60 border border-white/[0.08] rounded px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
          />
          <button
            id="bidi-send-custom"
            onClick={onSendCustom}
            disabled={sending}
            className="px-3 py-1.5 rounded font-mono text-[11px] font-medium bg-blue-500 text-zinc-950 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all cursor-pointer"
          >
            ↑ socket.emit(event)
          </button>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Server → Client (chủ động push)
        </p>
        <button
          id="bidi-server-push"
          onClick={onTriggerPush}
          disabled={sending}
          className="w-full px-3 py-1.5 rounded font-mono text-[11px] font-medium border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all cursor-pointer"
        >
          ↓ server.emit(notification)
        </button>
      </div>

      <button
        id="bidi-clear"
        onClick={onClear}
        className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
      >
        ✕ clear timeline
      </button>
    </div>
  );
}

export default WsBidirectionalControls;
