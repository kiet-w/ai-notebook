'use client';

import React from 'react';
import WsBadge from '@/components/atoms/ws/WsBadge';
import WsFrameDemo from '@/components/organisms/ws/WsFrameDemo';
import WsRoomDemo from '@/components/organisms/ws/WsRoomDemo';
import WsPushDemo from '@/components/organisms/ws/WsPushDemo';
import WsBidirectionalDemo from '@/components/organisms/ws/WsBidirectionalDemo';
import WsCycleSummary from '@/components/organisms/ws/WsCycleSummary';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';

interface SectionProps {
  phase: string;
  label: string;
  title: string;
  id: string;
  children: React.ReactNode;
}

function Section({ phase, label, title, id, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">{label}</span>
        <span className="font-mono text-[10px] text-zinc-800">·</span>
        <span className="font-mono text-[10px] text-blue-500/60">{phase}</span>
      </div>
      <h2 id={`${id}-heading`} className="text-[15px] font-semibold text-zinc-200 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Full WebSocket lifecycle page template — Phases 2-6 + full cycle summary.
 * Pairs with WsHandshakeTemplate (Phase 1) at /learn/websocket-handshake.
 */
export default function WsFramesTemplate() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#080c10] text-zinc-300">
      {/* Scanline */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-20">

        {/* Header */}
        <header className="pt-14 pb-8 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/learn/websocket-handshake"
              className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {t('ws.prevPhaseLink')}
            </Link>
          </div>
          <WsBadge className="mb-4">{t('ws.badgeFrames')}</WsBadge>

          <h1 className="mt-3 text-[clamp(1.5rem,4vw,2.2rem)] font-semibold leading-tight tracking-tight text-zinc-100">
            WebSocket{' '}
            <span className="text-blue-400">Frame · Room · Push</span>
          </h1>

          <p className="mt-3 text-[13.5px] text-zinc-500 leading-relaxed max-w-[60ch]">
            {t('ws.framesDesc')}
          </p>
        </header>

        {/* Sections */}
        <main className="mt-8 flex flex-col gap-10">

          {/* Phase 2 */}
          <Section id="frame" phase="Phase 2" label={t('ws.phase2Label')} title={t('ws.phase2Title')}>
            <WsFrameDemo />
          </Section>

          {/* Phase 3 */}
          <Section id="room" phase="Phase 3" label={t('ws.phase3Label')} title={t('ws.phase3Title')}>
            <WsRoomDemo />
          </Section>

          {/* Phase 4 */}
          <Section id="push" phase="Phase 4" label={t('ws.phase4Label')} title={t('ws.phase4Title')}>
            <WsPushDemo />
          </Section>

          {/* Phase 5 */}
          <Section id="bidi" phase="Phase 5" label={t('ws.phase5Label')} title={t('ws.phase5Title')}>
            <WsBidirectionalDemo />
          </Section>

          {/* Full cycle */}
          <Section id="cycle" phase={t('ws.summaryLabel')} label={t('ws.fullCycleLabel')} title={t('ws.fullCycleTitle')}>
            <WsCycleSummary />
          </Section>

        </main>

        <footer className="mt-14 pt-6 border-t border-white/[0.05] flex items-center justify-between">
          <span className="font-mono text-[10px] text-zinc-800">
            {t('ws.rfcGatewayFooter')}
          </span>
          <Link
            href="/learn/websocket-handshake"
            className="font-mono text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            {t('ws.backToPhase1')}
          </Link>
        </footer>
      </div>
    </div>
  );
}

