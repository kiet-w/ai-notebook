import React from 'react';

interface Step {
  num: number;
  phase: string;
  title: string;
  detail: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    num: 1, phase: 'Phase 1',
    title: 'Client gửi HTTP Upgrade + Sec-WebSocket-Key',
    detail: 'Random 16-byte key → base64. Server nhận, tính SHA1(key + MAGIC), trả 101 + Sec-WebSocket-Accept.',
    accent: 'border-blue-500/60 bg-blue-500/[0.07] text-blue-300',
  },
  {
    num: 2, phase: 'Phase 1',
    title: 'Client verify Accept → bắt tay thành công',
    detail: 'Client tự tính lại, so sánh. Khớp → chuyển sang đọc/ghi theo WebSocket Frame format trên cùng TCP connection.',
    accent: 'border-blue-500/40 bg-blue-500/[0.04] text-blue-400',
  },
  {
    num: 3, phase: 'Phase 2',
    title: 'Giao tiếp qua WebSocket Frame',
    detail: '[FIN+Opcode][Mask+Len][MaskKey?][Payload]. Client→Server: bắt buộc mask (XOR). Server→Client: không cần mask.',
    accent: 'border-purple-500/60 bg-purple-500/[0.07] text-purple-300',
  },
  {
    num: 4, phase: 'Phase 3',
    title: 'handleConnection → verify JWT → client.join(room)',
    detail: 'NestJS hook tự chạy sau handshake. JWT từ query param. Socket.IO lưu map { room: Set<socketId> } nội bộ.',
    accent: 'border-yellow-500/60 bg-yellow-500/[0.07] text-yellow-300',
  },
  {
    num: 5, phase: 'Phase 4',
    title: 'Server chủ động push — server.to(room).emit()',
    detail: 'Gọi từ service bất cứ lúc nào (sau khi DB lưu xong). Chỉ gửi đến đúng room, không broadcast toàn bộ.',
    accent: 'border-emerald-500/60 bg-emerald-500/[0.07] text-emerald-300',
  },
  {
    num: 6, phase: 'Phase 5',
    title: 'Client emit → @SubscribeMessage xử lý',
    detail: 'socket.emit("mark-read", noteId) → handler chạy, xử lý DB, có thể emit ngược lại. Full-duplex thật sự.',
    accent: 'border-orange-500/60 bg-orange-500/[0.07] text-orange-300',
  },
  {
    num: 7, phase: 'Phase 6',
    title: 'Closing Handshake — Close frame (0x8)',
    detail: '1 trong 2 bên gửi frame opcode Close. Bên kia echo lại Close frame. TCP connection đóng.',
    accent: 'border-red-500/60 bg-red-500/[0.07] text-red-300',
  },
];

/**
 * Full WebSocket lifecycle summary — all 6 phases in order.
 * Static Server Component.
 */
export default function WsCycleSummary() {
  return (
    <div className="flex flex-col gap-2">
      {STEPS.map((step, i) => (
        <div key={step.num}>
          <div className={`flex gap-3 items-start rounded border px-3 py-2.5 ${step.accent}`}>
            <div className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center font-mono text-[11px] font-bold mt-0.5">
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">{step.phase}</span>
                <span className="text-[12.5px] font-semibold text-zinc-200">{step.title}</span>
              </div>
              <p className="text-[11.5px] text-zinc-500 leading-relaxed">{step.detail}</p>
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div className="ml-4 w-px h-2 bg-white/[0.06]" />
          )}
        </div>
      ))}
    </div>
  );
}
