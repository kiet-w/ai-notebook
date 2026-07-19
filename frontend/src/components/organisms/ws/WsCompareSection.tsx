import React from 'react';

/**
 * Side-by-side comparison: "no hash (unsafe)" vs "with hash (RFC 6455)".
 * Static — no client state needed.
 */
export default function WsCompareSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Unsafe */}
      <div className="rounded-lg border border-red-500/25 bg-red-500/[0.04] overflow-hidden">
        <div className="px-3 py-2 border-b border-red-500/20 bg-red-500/[0.08] font-mono text-[10px] uppercase tracking-widest text-red-400">
          Không có hash — unsafe
        </div>
        <div className="px-3.5 py-3 text-[12.5px] leading-relaxed text-zinc-500 space-y-2">
          <p>
            Client gửi{' '}
            <code className="font-mono text-yellow-400/80 text-[11px]">GET /chat Upgrade: websocket</code>
          </p>
          <p>
            <span className="text-zinc-300 font-medium">Proxy cache</span> nhầm trả{' '}
            <code className="font-mono text-[11px] text-red-400">101 Switching Protocols</code> từ request trước đó.
          </p>
          <p>
            Client <span className="text-zinc-300 font-medium">không thể phân biệt</span> — không có gì để so
            sánh. Nhận 101 là tin. Kết nối bị{' '}
            <span className="text-red-400 font-medium">&quot;bắt tay hụt&quot;</span>.
          </p>
        </div>
      </div>

      {/* Safe */}
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] overflow-hidden">
        <div className="px-3 py-2 border-b border-emerald-500/20 bg-emerald-500/[0.08] font-mono text-[10px] uppercase tracking-widest text-emerald-400">
          Có hash — RFC 6455
        </div>
        <div className="px-3.5 py-3 text-[12.5px] leading-relaxed text-zinc-500 space-y-2">
          <p>
            Client gửi kèm{' '}
            <code className="font-mono text-yellow-400/80 text-[11px]">Sec-WebSocket-Key</code> ngẫu nhiên mỗi lần.
          </p>
          <p>
            Server phải tính hash từ đúng key đó và trả về{' '}
            <code className="font-mono text-[11px] text-emerald-400">Sec-WebSocket-Accept</code>.
          </p>
          <p>
            Client tự tính lại và so sánh —{' '}
            <span className="text-zinc-300 font-medium">proxy không thể giả mạo</span> vì key mỗi lần khác
            nhau → hash khác nhau.
          </p>
        </div>
      </div>
    </div>
  );
}
