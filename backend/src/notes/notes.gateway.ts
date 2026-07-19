import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotesService } from './notes.service';
import { JwtService } from '@nestjs/jwt';
import { Logger, OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Customize this for production
  },
})
export class NotesGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotesGateway.name);

  constructor(
    private readonly notesService: NotesService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.notesService.getEventStream().subscribe((event) => {
      const { userId, ...payload } = event;
      // Emit the event ONLY to the specific user's room
      this.server.to(`user-${userId}`).emit('note-updated', payload);
      this.logger.debug(
        `Pushed note-updated to room: user-${userId} for note ${payload.id}`,
      );
    });
  }

  async handleConnection(client: Socket) {
    try {
      // Token can be passed in query parameters or auth headers
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.headers.authorization?.split(' ')[1] as string);

      if (!token) {
        throw new Error('No token provided');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const userId = payload.sub;

      await client.join(`user-${userId}`);
      this.logger.log(`Client ${client.id} joined room user-${userId}`);
    } catch {
      this.logger.error(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
