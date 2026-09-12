import type { Metadata } from 'next';
import WsHandshakeTemplate from '@/components/templates/ws/WsHandshakeTemplate';

export const metadata: Metadata = {
  title: 'WebSocket Handshake Hash — Secondary Brain',
  description:
    'Demo tương tác giải thích cơ chế Sec-WebSocket-Key hash (RFC 6455) và tại sao nó ngăn proxy cache attack.',
};

/**
 * Route: /learn/websocket-handshake
 * Static page — interactivity is isolated in client-component leaves.
 */
export default function WsHandshakePage() {
  return <WsHandshakeTemplate />;
}
