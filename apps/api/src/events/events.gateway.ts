import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('Real-time Events Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, userId: string) {
    client.join(userId);
    this.logger.log(`Client ${client.id} joined room ${userId}`);
  }

  broadcast(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
      this.logger.log(`Broadcasted event "${event}" to clients`);
    } else {
      this.logger.warn(`Server not initialized, could not broadcast event "${event}"`);
    }
  }

  broadcastToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(userId).emit(event, data);
      this.logger.log(`Sent event "${event}" to user room "${userId}"`);
    } else {
      this.logger.warn(`Server not initialized, could not send event "${event}" to user "${userId}"`);
    }
  }
}
