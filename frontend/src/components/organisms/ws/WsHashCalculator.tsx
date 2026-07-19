'use client';

import React from 'react';
import WsCard from '@/components/organisms/ws/WsCard';
import WsHashRow from '@/components/molecules/ws/WsHashRow';

const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

interface HashState {
  key: string;
  concat: string;
  sha1Hex: string;
  b64: string;
}

interface WsHashCalculatorProps {
  data?: HashState;
}

const DEFAULT: HashState = {
  key:     'dGhlIHNhbXBsZSBub25jZQ==',
  concat:  'dGhlIHNhbXBsZSBub25jZQ==' + MAGIC,
  sha1Hex: 'b3 7a 4f 2c c0 62 4f 16 90 f6 46 06 cf 38 59 45 b2 be c4 ea',
  b64:     's3pPLMBiTxaQ9kYGzzhZRbK+xOo=',
};

/**
 * Hash pipeline visualizer: KEY + MAGIC → CONCAT → SHA-1 → BASE64.
 * Accepts live data from the simulator, shows RFC 6455 example values by default.
 */
export default function WsHashCalculator({ data }: WsHashCalculatorProps) {
  const d = data ?? DEFAULT;

  return (
    <WsCard title="hash-calculator — SubtleCrypto SHA-1 thật">
      <div className="p-4 flex flex-col gap-3">

        <WsHashRow
          label="KEY"
          leftValue={d.key}
          leftVariant="key"
          rightValue={MAGIC}
          rightVariant="magic"
        />

        <WsHashRow
          label="CONCAT"
          fullValue={d.concat}
          fullVariant="concat"
        />

        <WsHashRow
          label="SHA-1"
          fullValue={d.sha1Hex}
          fullVariant="sha"
        />

        <WsHashRow
          label="BASE64"
          fullValue={d.b64}
          fullVariant="b64"
        />

        {/* Magic string note */}
        <div className="mt-1 rounded border border-blue-500/20 border-l-2 border-l-blue-400 bg-blue-500/[0.04] px-3 py-2 text-[11.5px] leading-relaxed text-zinc-500">
          <span className="text-blue-400 font-medium">Magic String</span>{' '}
          <span className="font-mono text-[10.5px] text-orange-300/80 bg-orange-400/[0.08] border border-orange-400/20 rounded px-1.5 py-0.5">
            258EAFA5-E914-47DA-95CA-C5AB0DC85B11
          </span>{' '}
          là UUID cố định trong RFC 6455 §1.3 — không có ý nghĩa đặc biệt ngoài việc làm định
          danh protocol duy nhất. Cả client và server đều hardcode giá trị này.
        </div>
      </div>
    </WsCard>
  );
}

export type { HashState };
