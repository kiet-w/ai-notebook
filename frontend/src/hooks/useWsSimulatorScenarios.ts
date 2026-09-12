'use client';

import { useState, useRef } from 'react';
import { type LogEntry } from '@/components/atoms/ws/WsLogLine';
import { type FlowDiagramData } from '@/components/organisms/ws/WsFlowDiagram';
import { type HashState } from '@/components/organisms/ws/WsHashCalculator';
import { type StepState } from '@/components/atoms/ws/WsStepNum';
import { genKey, computeAccept } from '@/utils/wsCrypto';
import { type SimResult } from '@/components/molecules/ws/WsSimulatorLogs';

export interface SimState {
  logs: LogEntry[];
  status: 'idle' | 'running' | 'ok' | 'error';
  statusMsg: string;
  result: SimResult | null;
  flowData: FlowDiagramData | undefined;
  hashData: HashState | undefined;
}

export const IDLE_SIM_STATE: SimState = {
  logs: [],
  status: 'idle',
  statusMsg: 'Idle — chưa có kết nối',
  result: null,
  flowData: undefined,
  hashData: undefined,
};

export function useWsSimulatorScenarios(
  onFlowUpdate?: (data: FlowDiagramData) => void,
  onHashUpdate?: (data: HashState) => void
) {
  const [sim, setSim] = useState<SimState>(IDLE_SIM_STATE);
  const [running, setRunning] = useState(false);
  const logWrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number | null>(null);
  const idRef = useRef(0);

  function ts(): string {
    if (!startRef.current) startRef.current = Date.now();
    const d = Date.now() - startRef.current;
    const s = Math.floor(d / 1000).toString().padStart(2, '0');
    const ms = (d % 1000).toString().padStart(3, '0');
    return `${s}:${ms}`;
  }

  function addLog(src: LogEntry['src'], msg: string, cls: LogEntry['cls'] = 'default'): LogEntry {
    const entry: LogEntry = { id: String(++idRef.current), ts: ts(), src, msg, cls };
    setSim((prev) => ({ ...prev, logs: [...prev.logs, entry] }));
    setTimeout(() => {
      if (logWrapRef.current) {
        logWrapRef.current.scrollTop = logWrapRef.current.scrollHeight;
      }
    }, 20);
    return entry;
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function setFlowStep(key: string, accept: string, stepStates: StepState[], stepVisible = [true, true, true, true]) {
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

  const runNormal = async () => {
    if (running) return;
    setRunning(true);
    startRef.current = null;
    idRef.current = 0;
    setSim({ ...IDLE_SIM_STATE, status: 'running', statusMsg: 'Đang kết nối...' });

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
    setSim({ ...IDLE_SIM_STATE, status: 'running', statusMsg: 'Mô phỏng proxy attack...' });

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
    setSim(IDLE_SIM_STATE);
    onFlowUpdate?.(undefined as unknown as FlowDiagramData);
    onHashUpdate?.(undefined as unknown as HashState);
  };

  return {
    sim,
    running,
    logWrapRef,
    runNormal,
    runProxy,
    clear,
  };
}

export default useWsSimulatorScenarios;
