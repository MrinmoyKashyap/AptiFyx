import { createServer } from 'http';
import { createApp } from './gateway';
import { env } from './config/env';
import { pgPool } from './config/postgres';
import { connectMongo } from './config/mongodb';
import { SocketManager } from './sockets/socket-manager';
import { setupEventHandlers } from './event-handlers';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // 1. Connect Databases
    await connectMongo();
    // (Postgres connects automatically via pgPool)
    // (Redis connects automatically on import)

    // 2. Initialize App and Server
    const app = createApp();
    const httpServer = createServer(app);

    // 3. Initialize WebSockets
    const socketManager = new SocketManager(httpServer);

    // 4. Setup Cross-Service Event Subscriptions
    setupEventHandlers(socketManager);

    // 5. Start Listening
    httpServer.listen(env.PORT, () => {
      logger.info(\`🚀 AptiFyx Backend running on http://localhost:\${env.PORT}\`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      httpServer.close(() => {
        pgPool.end();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
