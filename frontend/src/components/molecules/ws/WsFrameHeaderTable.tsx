'use client';

import React from 'react';
import WsBitCell from '@/components/atoms/ws/WsBitCell';
import WsOpcodeBadge from '@/components/atoms/ws/WsOpcodeBadge';
import { toHexStr } from '@/utils/wsCrypto';

export interface WsFrameHeaderTableProps {
  fromClient: boolean;
  payloadLen: number;
  lenDisplay: string;
  maskKey: Uint8Array;
  maskedBytes: Uint8Array;
  payloadBytes: Uint8Array;
}

export function WsFrameHeaderTable({
  fromClient,
  payloadLen,
  lenDisplay,
  maskKey,
  maskedBytes,
  payloadBytes,
}: WsFrameHeaderTableProps) {
  return (
    <>
      {/* Frame structure diagram */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Cấu trúc frame (RFC 6455)
        </p>
        <div className="grid grid-cols-8 gap-1">
          {/* Byte 0 */}
          <WsBitCell label="FIN" detail="1 bit" variant="blue" value="1" />
          <WsBitCell label="RSV1" detail="1 bit" variant="gray" value="0" />
          <WsBitCell label="RSV2" detail="1 bit" variant="gray" value="0" />
          <WsBitCell label="RSV3" detail="1 bit" variant="gray" value="0" />
          <WsBitCell label="Opcode" detail="4 bits" bits={4} variant="purple" value="0x1 text" />
          {/* Byte 1 */}
          <WsBitCell
            label="MASK"
            detail="1 bit"
            variant={fromClient ? 'yellow' : 'gray'}
            value={fromClient ? '1' : '0'}
          />
          <WsBitCell label="Payload Len" detail="7 bits" bits={7} variant="green" value={lenDisplay} />
          {/* Extended len + mask key */}
          {payloadLen > 125 && (
            <WsBitCell
              label={payloadLen <= 65535 ? 'Ext Len (16-bit)' : 'Ext Len (64-bit)'}
              detail={payloadLen <= 65535 ? '2 bytes' : '8 bytes'}
              bits={8}
              variant="green"
              value={String(payloadLen)}
            />
          )}
          {fromClient && (
            <WsBitCell
              label="Masking Key"
              detail="4 bytes"
              bits={8}
              variant="orange"
              value={toHexStr(maskKey)}
            />
          )}
          <WsBitCell
            label="Payload Data"
            detail={`${payloadLen} bytes`}
            bits={8}
            variant={fromClient ? 'red' : 'blue'}
            value={fromClient
              ? toHexStr(maskedBytes).slice(0, 30) + (maskedBytes.length > 10 ? '…' : '')
              : toHexStr(payloadBytes).slice(0, 30) + (payloadBytes.length > 10 ? '…' : '')}
          />
        </div>
      </div>

      {/* Opcode table */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Các loại Opcode
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(['text','binary','close','ping','pong'] as const).map((op) => (
            <WsOpcodeBadge key={op} opcode={op} />
          ))}
        </div>
      </div>
    </>
  );
}

export default WsFrameHeaderTable;
