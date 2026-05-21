import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class SocketManager {
  private io: SocketServer;
  
  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: { origin: '*' }
    });

    // Auth middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.user.userId;
      const role = socket.data.user.roles;
      
      logger.info(\`User \${userId} connected via WebSocket\`);
      
      // Users join their own room to receive private notifications
      socket.join(\`user:\${userId}\`);

      socket.on('chat:join', (roomId: string) => {
        socket.join(\`chat:\${roomId}\`);
      });
      
      socket.on('tracking:subscribe', (partnerId: string) => {
        socket.join(\`tracking:\${partnerId}\`);
      });

      socket.on('disconnect', () => {
        logger.info(\`User \${userId} disconnected\`);
      });
    });
  }

  // Push notification to a specific user
  public notifyUser(userId: string, event: string, payload: any) {
    this.io.to(\`user:\${userId}\`).emit(event, payload);
  }

  // Broadcast to a chat room
  public emitToChat(roomId: string, event: string, payload: any) {
    this.io.to(\`chat:\${roomId}\`).emit(event, payload);
  }

  // Broadcast partner location update
  public emitTracking(partnerId: string, payload: any) {
    this.io.to(\`tracking:\${partnerId}\`).emit('tracking:update', payload);
  }
}
