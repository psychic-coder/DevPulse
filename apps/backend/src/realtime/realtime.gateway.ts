import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.query.token as string;
      if (!token) {
        socket.disconnect();
        this.logger.warn('Connection attempt without token');
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as unknown as { sub: string };

      socket.userId = payload.sub;
      const roomName = `room:${payload.sub}`;
      await socket.join(roomName);

      // Track user sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      const userSocketsSet = this.userSockets.get(payload.sub);
      if (userSocketsSet) {
        userSocketsSet.add(socket.id);
      }

      this.logger.log(`User ${payload.sub} connected (socket: ${socket.id})`);
    } catch (error) {
      this.logger.error(
        `Connection authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      const userSockets = this.userSockets.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(socket.userId);
        }
      }
      this.logger.log(
        `User ${socket.userId} disconnected (socket: ${socket.id})`,
      );
    }
  }

  @SubscribeMessage('ping')
  handlePing(socket: AuthenticatedSocket): void {
    socket.emit('pong');
  }

  /**
   * Emit event to a specific user's room
   */
  emitToUser(userId: string, event: string, data: any): void {
    const roomName = `room:${userId}`;
    this.server.to(roomName).emit(event, data);
    this.logger.debug(`Emitted ${event} to ${roomName}`);
  }

  /**
   * Emit sync_started event
   */
  emitSyncStarted(userId: string, startedAt: Date): void {
    this.emitToUser(userId, 'sync_started', {
      startedAt: startedAt.toISOString(),
    });
  }

  /**
   * Emit new_commit event
   */
  emitNewCommit(
    userId: string,
    data: {
      sha: string;
      message: string;
      repo: string;
      committed_at: string;
      additions?: number;
      deletions?: number;
    },
  ): void {
    this.emitToUser(userId, 'new_commit', data);
  }

  /**
   * Emit new_pr event
   */
  emitNewPR(
    userId: string,
    data: {
      id: string;
      title: string;
      state: 'open' | 'closed' | 'merged';
      repo: string;
      created_at: string;
      url?: string;
    },
  ): void {
    this.emitToUser(userId, 'new_pr', data);
  }

  /**
   * Emit sync_complete event
   */
  emitSyncComplete(
    userId: string,
    data: {
      totalCommits: number;
      totalPRs: number;
      syncedAt: Date;
      newCommits?: number;
      newPRs?: number;
    },
  ): void {
    this.emitToUser(userId, 'sync_complete', {
      ...data,
      syncedAt: data.syncedAt.toISOString(),
    });
  }

  /**
   * Check if user has active connections
   */
  hasActiveConnections(userId: string): boolean {
    const userSockets = this.userSockets.get(userId);
    return !!(userSockets && userSockets.size > 0);
  }

  /**
   * Get count of active connections for a user
   */
  getConnectionCount(userId: string): number {
    const userSockets = this.userSockets.get(userId);
    return userSockets ? userSockets.size : 0;
  }
}
