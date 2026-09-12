'use client';

import React, { useState } from 'react';
import WsBadge from '@/components/atoms/ws/WsBadge';
import WsCompareSection from '@/components/organisms/ws/WsCompareSection';
import WsFlowDiagram, { type FlowDiagramData } from '@/components/organisms/ws/WsFlowDiagram';
import WsHashCalculator, { type HashState } from '@/components/organisms/ws/WsHashCalculator';
import WsSimulator from '@/components/organisms/ws/WsSimulator';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';

/**
 * Full-page template for the WebSocket handshake hash explainer.
 * Coordinates live state between WsSimulator (source) and
 * WsFlowDiagram + WsHashCalculator (consumers).
 */
export default function WsHandshakeTemplate() {
  const { t } = useI18n();
  const [flowData, setFlowData] = useState<FlowDiagramData | undefined>(undefined);
  const [hashData, setHashData] = useState<HashState | undefined>(undefined);

  return (
    <div className="min-h-screen bg-[#080c10] text-zinc-300">
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-20">
        {/* ── HEADER ── */}
        <header className="pt-14 pb-8 border-b border-white/[0.07]">
          <WsBadge className="mb-4">{t('ws.badgeHandshake')}</WsBadge>

          <h1 className="mt-3 text-[clamp(1.5rem,4vw,2.2rem)] font-semibold leading-tight tracking-tight text-zinc-100">
            {t('ws.handshakeTitle')}
          </h1>

          <p className="mt-3 text-[13.5px] text-zinc-500 leading-relaxed max-w-[60ch]">
            {t('ws.handshakeDesc')}
          </p>
        </header>

        {/* ── SECTIONS ── */}
        <main className="mt-8 flex flex-col gap-8">

          {/* ① Compare */}
          <section aria-labelledby="compare-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              {t('ws.problemLabel')}
            </p>
            <h2 id="compare-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              {t('ws.problemTitle')}
            </h2>
            <WsCompareSection />
          </section>

          {/* ② Flow diagram */}
          <section aria-labelledby="flow-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              {t('ws.mechanismLabel')}
            </p>
            <h2 id="flow-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              {t('ws.mechanismTitle')}
            </h2>
            <WsFlowDiagram data={flowData} />
          </section>

          {/* ③ Hash calculator */}
          <section aria-labelledby="hash-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              {t('ws.detailLabel')}
            </p>
            <h2 id="hash-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              {t('ws.detailTitle')}
            </h2>
            <WsHashCalculator data={hashData} />
          </section>

          {/* ④ Simulator */}
          <section aria-labelledby="sim-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              {t('ws.simLabel')}
            </p>
            <h2 id="sim-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              {t('ws.simTitle')}
            </h2>
            <WsSimulator
              onFlowUpdate={setFlowData}
              onHashUpdate={setHashData}
            />
          </section>

          {/* ⑤ Summary */}
          <section aria-labelledby="summary-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              {t('ws.summaryLabel')}
            </p>
            <h2 id="summary-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              {t('ws.summaryTitle')}
            </h2>
            <div className="rounded border border-blue-500/20 border-l-2 border-l-blue-400 bg-blue-500/[0.04] px-4 py-3 text-[13px] leading-relaxed text-zinc-500">
              {t('ws.summaryQuote')}
            </div>
          </section>

        </main>

        <footer className="mt-14 pt-6 border-t border-white/[0.05] flex items-center justify-between">
          <span className="font-mono text-[10px] text-zinc-800">
            {t('ws.rfcHandshakeFooter')}
          </span>
          <Link
            href="/learn/websocket-frames"
            className="font-mono text-[10px] text-zinc-600 hover:text-blue-400 transition-colors"
          >
            {t('ws.nextPhasesLink')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
