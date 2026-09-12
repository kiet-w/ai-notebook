import type { Metadata } from 'next';
import WsFramesTemplate from '@/components/templates/ws/WsFramesTemplate';

export const metadata: Metadata = {
  title: 'WebSocket Frames, Rooms & Push — Secondary Brain',
  description:
    'Demo tương tác: WebSocket Frame structure, XOR masking, Socket.IO rooms, server push và @SubscribeMessage (Phases 2-6).',
};

/**
 * Route: /learn/websocket-frames
 * Interactive demo for WebSocket Phases 2-6.
 */
export default function WsFramesPage() {
  return <WsFramesTemplate />;
}
