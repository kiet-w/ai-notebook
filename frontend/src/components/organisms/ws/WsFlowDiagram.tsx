'use client';

import React from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsFlowStep from '@/components/molecules/ws/WsFlowStep';
import { type StepState } from '@/components/atoms/ws/WsStepNum';

export interface FlowStepState {
  state: StepState;
  visible: boolean;
}

export interface FlowDiagramData {
  key: string;
  accept: string;
  steps: FlowStepState[];
}

const DEFAULT_KEY = 'dGhlIHNhbXBsZSBub25jZQ==';
const DEFAULT_ACCEPT = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

interface WsFlowDiagramProps {
  data?: FlowDiagramData;
}

/**
 * 4-step handshake flow diagram.
 * Accepts external data from the simulator; shows sensible defaults otherwise.
 */
export default function WsFlowDiagram({ data }: WsFlowDiagramProps) {
  const key    = data?.key    ?? DEFAULT_KEY;
  const accept = data?.accept ?? DEFAULT_ACCEPT;

  const stepState = (idx: number): StepState =>
    data?.steps[idx]?.state ?? 'idle';
  const stepVisible = (idx: number): boolean =>
    data?.steps[idx]?.visible ?? true;

  const matchOk = data
    ? data.steps[3]?.state === 'ok'
    : true;

  const matchNode = matchOk ? (
    <span className="text-emerald-400">✓ YES — Handshake hợp lệ!</span>
  ) : (
    <span className="text-red-400">✗ MISMATCH — Từ chối handshake!</span>
  );

  return (
    <WsCard title="websocket-handshake.flow">
      <div className="p-4 flex flex-col gap-3">

        <WsFlowStep num={1} state={stepState(0)} visible={stepVisible(0)}
          label="Client tạo key ngẫu nhiên">
          <span className="text-zinc-600">GET /chat HTTP/1.1{'\n'}</span>
          <span className="text-zinc-600">Upgrade: </span><span className="text-blue-400">websocket{'\n'}</span>
          <span className="text-zinc-600">Sec-WebSocket-Key: </span>
          <span className="text-purple-300">{key}</span>
          <span className="text-zinc-700">   ← random base64(16 bytes){'\n'}</span>
          <span className="text-zinc-600">Sec-WebSocket-Version: </span>
          <span className="text-zinc-700">13</span>
        </WsFlowStep>

        <div className="ml-9 w-px h-4 bg-white/[0.08]" />

        <WsFlowStep num={2} state={stepState(1)} visible={stepVisible(1)}
          label="Server ghép key + Magic String (RFC 6455 §1.3)">
          <span className="text-zinc-600">concat = </span>
          <span className="text-purple-300">{key}</span>
          <span className="text-orange-300">{MAGIC}{'\n'}</span>
          <span className="text-zinc-600">sha1   = SHA1( concat ){'\n'}</span>
          <span className="text-zinc-600">accept = base64( sha1 )</span>
        </WsFlowStep>

        <div className="ml-9 w-px h-4 bg-white/[0.08]" />

        <WsFlowStep num={3} state={stepState(2)} visible={stepVisible(2)}
          label="Server gửi response với giá trị đã tính">
          <span className="text-zinc-600">HTTP/1.1 101 Switching Protocols{'\n'}</span>
          <span className="text-zinc-600">Upgrade: </span><span className="text-blue-400">websocket{'\n'}</span>
          <span className="text-zinc-600">Sec-WebSocket-Accept: </span>
          <span className="text-emerald-300">{accept}</span>
        </WsFlowStep>

        <div className="ml-9 w-px h-4 bg-white/[0.08]" />

        <WsFlowStep num={4} state={stepState(3)} visible={stepVisible(3)}
          label="Client tự tính lại và so sánh">
          <span className="text-zinc-600">expected = base64(SHA1(</span>
          <span className="text-purple-300">key</span>
          <span className="text-zinc-600"> + </span>
          <span className="text-orange-300">MAGIC</span>
          <span className="text-zinc-600">) ) = </span>
          <span className="text-emerald-300">{accept}{'\n'}</span>
          <span className="text-zinc-600">received =                                </span>
          <span className={matchOk ? 'text-emerald-300' : 'text-red-300'}>{accept}{'\n'}</span>
          <span className="text-zinc-600">match?   → </span>
          {matchNode}
        </WsFlowStep>

      </div>
    </WsCard>
  );
}
