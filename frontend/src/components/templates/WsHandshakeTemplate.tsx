'use client';

import React, { useState } from 'react';
import WsBadge from '@/components/atoms/ws/WsBadge';
import WsCompareSection from '@/components/organisms/ws/WsCompareSection';
import WsFlowDiagram, { type FlowDiagramData } from '@/components/organisms/ws/WsFlowDiagram';
import WsHashCalculator, { type HashState } from '@/components/organisms/ws/WsHashCalculator';
import WsSimulator from '@/components/organisms/ws/WsSimulator';
import Link from 'next/link';

/**
 * Full-page template for the WebSocket handshake hash explainer.
 * Coordinates live state between WsSimulator (source) and
 * WsFlowDiagram + WsHashCalculator (consumers).
 */
export default function WsHandshakeTemplate() {
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
          <WsBadge className="mb-4">RFC 6455 · WebSocket Handshake</WsBadge>

          <h1 className="mt-3 text-[clamp(1.5rem,4vw,2.2rem)] font-semibold leading-tight tracking-tight text-zinc-100">
            Tại sao WebSocket cần bước{' '}
            <span className="text-blue-400">hash</span> trong handshake?
          </h1>

          <p className="mt-3 text-[13.5px] text-zinc-500 leading-relaxed max-w-[60ch]">
            Demo tương tác:{' '}
            <code className="font-mono text-yellow-400/80 text-[12px]">Sec-WebSocket-Key</code>
            {' '}→ SHA-1 → Base64 →{' '}
            <code className="font-mono text-emerald-400/80 text-[12px]">Sec-WebSocket-Accept</code>
            , và chứng minh tại sao bước này ngăn được proxy cache trả lại response cũ.
          </p>
        </header>

        {/* ── SECTIONS ── */}
        <main className="mt-8 flex flex-col gap-8">

          {/* ① Compare */}
          <section aria-labelledby="compare-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              Vấn đề
            </p>
            <h2 id="compare-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              Không có hash — dễ bị proxy/cache lừa
            </h2>
            <WsCompareSection />
          </section>

          {/* ② Flow diagram */}
          <section aria-labelledby="flow-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              Cơ chế
            </p>
            <h2 id="flow-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              Luồng hash — từng bước
            </h2>
            <WsFlowDiagram data={flowData} />
          </section>

          {/* ③ Hash calculator */}
          <section aria-labelledby="hash-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              Chi tiết tính toán
            </p>
            <h2 id="hash-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              Quá trình tính{' '}
              <code className="font-mono text-[0.85em] text-yellow-400/80">
                Sec-WebSocket-Accept
              </code>
            </h2>
            <WsHashCalculator data={hashData} />
          </section>

          {/* ④ Simulator */}
          <section aria-labelledby="sim-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              Mô phỏng
            </p>
            <h2 id="sim-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              Live Simulator — kết nối bình thường vs proxy attack
            </h2>
            <WsSimulator
              onFlowUpdate={setFlowData}
              onHashUpdate={setHashData}
            />
          </section>

          {/* ⑤ Summary */}
          <section aria-labelledby="summary-heading">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 mb-2">
              Tóm tắt
            </p>
            <h2 id="summary-heading" className="text-[15px] font-semibold text-zinc-200 mb-3">
              Mục đích của bước hash — một câu
            </h2>
            <div className="rounded border border-blue-500/20 border-l-2 border-l-blue-400 bg-blue-500/[0.04] px-4 py-3 text-[13px] leading-relaxed text-zinc-500">
              Bước hash đảm bảo response{' '}
              <span className="text-zinc-300 font-medium">101 Switching Protocols</span> mà
              client nhận được là{' '}
              <span className="text-blue-400 font-medium">
                do chính server này vừa xử lý đúng request này
              </span>{' '}
              — không phải response cũ/nhầm từ proxy cache — vì mỗi lần connect client tạo key
              random mới, server phải hash đúng key đó mới match được; proxy không thể tái sử
              dụng response cũ.
            </div>
          </section>

        </main>

        <footer className="mt-14 pt-6 border-t border-white/[0.05] flex items-center justify-between">
          <span className="font-mono text-[10px] text-zinc-800">
            RFC 6455 — §1.3 Opening Handshake
          </span>
          <Link
            href="/learn/websocket-frames"
            className="font-mono text-[10px] text-zinc-600 hover:text-blue-400 transition-colors"
          >
            Phase 2–6: Frames, Rooms & Push →
          </Link>
        </footer>
      </div>
    </div>
  );
}
