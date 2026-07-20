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
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Interval } from '@nestjs/schedule';

const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://campus-connect.vercel.app',
  ];
};

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = getAllowedOrigins();
      if (!origin || allowed.includes(origin) || /^https:\/\/campus-connect-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Socket.IO CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  },
  namespace: 'events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      try {
        const secret = process.env.JWT_SECRET || 'jwt_secret_key';
        const decoded = jwt.verify(token, secret);
        (socket as any).user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });
    this.logger.log('Real-time Events Gateway initialized with JWT auth middleware');
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`Client authenticated successfully: ${client.id} (user ID: ${user?.sub})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, userId: string) {
    const user = (client as any).user;
    if (!user || user.sub !== userId) {
      this.logger.warn(`Room Join Blocked: User ${user?.sub || 'anonymous'} is not authorized to join room ${userId}`);
      return;
    }
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

  @Interval(5000)
  async broadcastSystemHealth() {
    let dbStatus = 'UP';
    let redisStatus = 'UP';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'DOWN';
    }

    try {
      const redisPing = await this.redisService.ping();
      if (redisPing.status !== 'UP') {
        redisStatus = 'DOWN';
      }
    } catch (e) {
      redisStatus = 'DOWN';
    }

    const payload = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'UP',
        database: dbStatus,
        redis: redisStatus,
        socketIo: 'UP',
        storage: 'UP',
      },
    };

    this.broadcast('system:health', payload);
  }
}

