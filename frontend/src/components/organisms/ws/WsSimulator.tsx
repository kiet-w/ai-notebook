'use client';

import React, { useState, useRef } from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsStatusBar from '@/components/molecules/ws/WsStatusBar';
import WsLogLine, { type LogEntry } from '@/components/atoms/ws/WsLogLine';
import { type FlowDiagramData } from '@/components/organisms/ws/WsFlowDiagram';
import { type HashState } from '@/components/organisms/ws/WsHashCalculator';
import { type StepState } from '@/components/atoms/ws/WsStepNum';

const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// ── crypto helpers ──────────────────────────────────────────────────────────

function genKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

async function computeSha1(str: string): Promise<Uint8Array> {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return new Uint8Array(hash);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function computeAccept(key: string): Promise<{ concat: string; sha1Hex: string; accept: string }> {
  const concat = key + MAGIC;
  const hashBytes = await computeSha1(concat);
  return { concat, sha1Hex: toHex(hashBytes), accept: toB64(hashBytes) };
}

// ── types ───────────────────────────────────────────────────────────────────

interface SimResult {
  icon: '✅' | '❌';
  title: string;
  sub: string;
  ok: boolean;
}

interface SimState {
  logs: LogEntry[];
  status: 'idle' | 'running' | 'ok' | 'error';
  statusMsg: string;
  result: SimResult | null;
  flowData: FlowDiagramData | undefined;
  hashData: HashState | undefined;
}

interface WsSimulatorProps {
  onFlowUpdate?: (data: FlowDiagramData) => void;
  onHashUpdate?: (data: HashState) => void;
}

const IDLE_STATE: SimState = {
  logs: [],
  status: 'idle',
  statusMsg: 'Idle — chưa có kết nối',
  result: null,
  flowData: undefined,
  hashData: undefined,
};

// ── component ────────────────────────────────────────────────────────────────

/**
 * Live WebSocket handshake simulator.
 * Runs "normal connect" and "proxy attack" scenarios with real SHA-1 hashes.
 * Calls onFlowUpdate / onHashUpdate to drive sibling organisms.
 */
export default function WsSimulator({ onFlowUpdate, onHashUpdate }: WsSimulatorProps) {
  const [sim, setSim] = useState<SimState>(IDLE_STATE);
  const [running, setRunning] = useState(false);
  const logWrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number | null>(null);
  const idRef = useRef(0);

  // ── helpers ──────────────────────────────────────────────────────────────

  function ts(): string {
    if (!startRef.current) startRef.current = Date.now();
    const d = Date.now() - startRef.current;
    const s = Math.floor(d / 1000).toString().padStart(2, '0');
    const ms = (d % 1000).toString().padStart(3, '0');
    return `${s}:${ms}`;
  }

  function addLog(src: LogEntry['src'], msg: string, cls: LogEntry['cls'] = 'default'): LogEntry {
    const entry: LogEntry = { id: String(++idRef.current), ts: ts(), src, msg, cls };
    setSim((prev) => {
      const next = { ...prev, logs: [...prev.logs, entry] };
      return next;
    });
    setTimeout(() => {
      if (logWrapRef.current) {
        logWrapRef.current.scrollTop = logWrapRef.current.scrollHeight;
      }
    }, 20);
    return entry;
  }

  function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setFlowStep(
    key: string,
    accept: string,
    stepStates: StepState[],
    stepVisible: boolean[] = [true, true, true, true],
  ) {
    const flowData: FlowDiagramData = {
      key,
      accept,
      steps: stepStates.map((state, i) => ({ state, visible: stepVisible[i] ?? true })),
    };
    setSim((prev) => ({ ...prev, flowData }));
    onFlowUpdate?.(flowData);
  }

  function setHashData(key: string, concat: string, sha1Hex: string, b64: string) {
    const hashData: HashState = { key, concat, sha1Hex, b64 };
    setSim((prev) => ({ ...prev, hashData }));
    onHashUpdate?.(hashData);
  }

  // ── scenarios ─────────────────────────────────────────────────────────────

  const runNormal = async () => {
    if (running) return;
    setRunning(true);
    startRef.current = null;
    idRef.current = 0;
    setSim({ ...IDLE_STATE, status: 'running', statusMsg: 'Đang kết nối...' });

    const myKey = genKey();
    const { concat, sha1Hex, accept } = await computeAccept(myKey);

    setFlowStep(myKey, accept, ['idle', 'idle', 'idle', 'idle']);

    await delay(200);
    addLog('CLIENT', 'Generating random 16-byte nonce...');
    await delay(300);
    addLog('CLIENT', `Sec-WebSocket-Key = ${myKey}`, 'warn');
    setFlowStep(myKey, accept, ['ok', 'idle', 'idle', 'idle']);

    await delay(500);
    addLog('CLIENT', 'Sending HTTP Upgrade request...');
    await delay(400);
    addLog('SERVER', 'Received upgrade request');
    await delay(250);
    addLog('SERVER', 'Concatenating: key + MAGIC_STRING', 'dim');
    await delay(250);
    addLog('SERVER', 'Running SHA-1 hash...', 'dim');
    await delay(300);
    addLog('SERVER', `accept = base64(sha1) = ${accept}`, 'ok');
    setFlowStep(myKey, accept, ['ok', 'ok', 'idle', 'idle']);
    setHashData(myKey, concat, sha1Hex, accept);

    await delay(500);
    addLog('SERVER', 'Sending HTTP/1.1 101 Switching Protocols...');
    await delay(300);
    addLog('SERVER', `Sec-WebSocket-Accept = ${accept}`, 'warn');
    setFlowStep(myKey, accept, ['ok', 'ok', 'ok', 'idle']);

    await delay(500);
    addLog('CLIENT', 'Received 101 response');
    await delay(300);
    addLog('CLIENT', 'Computing expected accept from MY key...', 'dim');
    await delay(350);
    addLog('CLIENT', `expected = ${accept}`, 'ok');
    await delay(250);
    addLog('CLIENT', `received = ${accept}`, 'ok');
    await delay(350);
    addLog('CLIENT', 'MATCH ✓ — Handshake valid!', 'ok');
    setFlowStep(myKey, accept, ['ok', 'ok', 'ok', 'ok']);

    await delay(400);
    addLog('SYSTEM', 'WebSocket connection established ✓', 'ok');

    setSim((prev) => ({
      ...prev,
      status: 'ok',
      statusMsg: 'Connected — WebSocket handshake OK',
      result: {
        ok: true,
        icon: '✅',
        title: 'Kết nối thành công!',
        sub: `Key: ${myKey.slice(0, 20)}...  Accept: ${accept.slice(0, 16)}...`,
      },
    }));
    setRunning(false);
  };

  const runProxy = async () => {
    if (running) return;
    setRunning(true);
    startRef.current = null;
    idRef.current = 0;
    setSim({ ...IDLE_STATE, status: 'running', statusMsg: 'Mô phỏng proxy attack...' });

    const staleKey = genKey();
    const { accept: staleAccept } = await computeAccept(staleKey);
    const currentKey = genKey();
    const { concat, sha1Hex, accept: currentAccept } = await computeAccept(currentKey);

    setFlowStep(currentKey, staleAccept, ['idle', 'idle', 'idle', 'idle']);

    await delay(200);
    addLog('SYSTEM', '[PROXY ATTACK] Proxy đang giữ cached response từ lần connect trước...', 'warn');
    await delay(350);
    addLog('PROXY',  `Stale cached key    = ${staleKey.slice(0, 22)}...`, 'warn');
    await delay(300);
    addLog('PROXY',  `Stale cached accept = ${staleAccept.slice(0, 22)}...`, 'warn');

    await delay(500);
    addLog('CLIENT', 'Generating NEW random key for THIS connection...', 'dim');
    await delay(350);
    addLog('CLIENT', `Sec-WebSocket-Key = ${currentKey}`, 'warn');
    setFlowStep(currentKey, staleAccept, ['warn', 'idle', 'idle', 'idle']);

    await delay(500);
    addLog('CLIENT', 'Sending HTTP Upgrade request...');
    await delay(400);
    addLog('PROXY',  'Intercepting request! Found cached 101 response!', 'bad');
    await delay(350);
    addLog('PROXY',  `Returning stale Sec-WebSocket-Accept = ${staleAccept.slice(0, 22)}...`, 'bad');
    setFlowStep(currentKey, staleAccept, ['warn', 'warn', 'warn', 'idle']);
    setHashData(currentKey, concat, sha1Hex, currentAccept);

    await delay(500);
    addLog('CLIENT', 'Received 101 (from PROXY, not real server!)','warn');
    await delay(350);
    addLog('CLIENT', 'Computing expected accept from MY key...', 'dim');
    await delay(400);
    addLog('CLIENT', `expected = ${currentAccept}   ← từ key hiện tại`, 'ok');
    await delay(300);
    addLog('CLIENT', `received = ${staleAccept}   ← từ proxy cache`, 'bad');
    await delay(400);
    addLog('CLIENT', 'MISMATCH ✗ — hai giá trị KHÁC NHAU!', 'bad');
    setFlowStep(currentKey, staleAccept, ['warn', 'warn', 'warn', 'bad']);

    await delay(350);
    addLog('CLIENT', 'Refusing connection — handshake invalid!', 'bad');
    await delay(400);
    addLog('SYSTEM', '→ Hash mechanism detected and blocked the proxy attack!', 'ok');

    setSim((prev) => ({
      ...prev,
      status: 'error',
      statusMsg: 'Proxy attack detected — connection rejected',
      result: {
        ok: false,
        icon: '❌',
        title: 'Proxy Attack bị chặn thành công!',
        sub: `expected: ${currentAccept.slice(0, 18)}... ≠ received: ${staleAccept.slice(0, 18)}...`,
      },
    }));
    setRunning(false);
  };

  const clear = () => {
    setSim(IDLE_STATE);
    onFlowUpdate?.(undefined as unknown as FlowDiagramData);
    onHashUpdate?.(undefined as unknown as HashState);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <WsCard title="ws-simulator — SHA-1 tính bằng SubtleCrypto thật">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 px-3.5 py-2.5 border-b border-white/[0.06]">
        <button
          id="ws-sim-connect"
          disabled={running}
          onClick={runNormal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-medium bg-blue-500 text-zinc-950 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all"
        >
          ▶ Connect (Normal)
        </button>

        <button
          id="ws-sim-proxy"
          disabled={running}
          onClick={runProxy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] font-medium border border-red-500/60 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all"
        >
          ⚡ Simulate Proxy Attack
        </button>

        <button
          id="ws-sim-clear"
          onClick={clear}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] border border-white/[0.08] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-all"
        >
          ✕ Clear
        </button>
      </div>

      {/* Connector progress bar */}
      <div className="h-[2px] bg-white/[0.04] overflow-hidden">
        {running && (
          <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[connectorScan_1.8s_linear_infinite]" />
        )}
      </div>

      {/* Log */}
      <div
        ref={logWrapRef}
        className="px-3.5 py-3 min-h-72 max-h-96 overflow-y-auto"
      >
        {sim.logs.length === 0 ? (
          <div className="font-mono text-[11px] text-zinc-700">
            Simulator ready. Nhấn &quot;Connect&quot; để bắt đầu.
          </div>
        ) : (
          sim.logs.map((entry) => <WsLogLine key={entry.id} entry={entry} />)
        )}
      </div>

      {/* Result */}
      {sim.result && (
        <div className="flex flex-col items-center gap-2 py-4 border-t border-white/[0.06]">
          <div className="text-3xl">{sim.result.icon}</div>
          <div
            className={`text-sm font-semibold ${sim.result.ok ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {sim.result.title}
          </div>
          <div className="font-mono text-[10.5px] text-zinc-600">{sim.result.sub}</div>
        </div>
      )}

      <WsStatusBar state={sim.status} message={sim.statusMsg} />
    </WsCard>
  );
}
