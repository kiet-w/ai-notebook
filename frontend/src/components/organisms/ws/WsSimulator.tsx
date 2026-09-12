'use client';

import React from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsStatusBar from '@/components/molecules/ws/WsStatusBar';
import { type FlowDiagramData } from '@/components/organisms/ws/WsFlowDiagram';
import { type HashState } from '@/components/organisms/ws/WsHashCalculator';
import WsSimulatorControls from '@/components/molecules/ws/WsSimulatorControls';
import WsSimulatorLogs from '@/components/molecules/ws/WsSimulatorLogs';
import { useWsSimulatorScenarios } from '@/hooks/useWsSimulatorScenarios';

export interface WsSimulatorProps {
  onFlowUpdate?: (data: FlowDiagramData) => void;
  onHashUpdate?: (data: HashState) => void;
}

export default function WsSimulator({ onFlowUpdate, onHashUpdate }: WsSimulatorProps) {
  const { sim, running, logWrapRef, runNormal, runProxy, clear } = useWsSimulatorScenarios(
    onFlowUpdate,
    onHashUpdate
  );

  return (
    <WsCard title="ws-simulator — SHA-1 tính bằng SubtleCrypto thật">
      <WsSimulatorControls
        running={running}
        onConnect={runNormal}
        onProxyAttack={runProxy}
        onClear={clear}
      />
      <WsSimulatorLogs
        logs={sim.logs}
        result={sim.result}
        logWrapRef={logWrapRef}
      />
      <WsStatusBar state={sim.status} message={sim.statusMsg} />
    </WsCard>
  );
}
