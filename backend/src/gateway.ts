import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalErrorHandler } from './middleware/error-handler';

// Import Routes
import identityRoutes from './modules/identity/routes';
import locationRoutes from './modules/location/routes';
import orderRoutes from './modules/order/routes';
import ledgerRoutes from './modules/ledger/routes';
import chatRoutes from './modules/chat/routes';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/v1/auth', identityRoutes);
  app.use('/api/v1/profile', identityRoutes); // Identity handles both
  app.use('/api/v1/location', locationRoutes);
  app.use('/api/v1/jobs', orderRoutes);
  app.use('/api/v1/wallet', ledgerRoutes);
  app.use('/api/v1/chat', chatRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
};
