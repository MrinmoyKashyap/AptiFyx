import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import providerRoutes from './routes/provider.routes';
import jobRoutes from './routes/job.routes';
import paymentRoutes from './routes/payment.routes';
import { setupSocketHandlers } from './socket/socket.handler';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);

// Services list (static config)
app.get('/api/services', (_, res) => {
  res.json([
    { slug: 'plumbing', name: 'Plumbing', icon: 'pipe-wrench', color: '#3B82F6' },
    { slug: 'electrician', name: 'Electrician', icon: 'lightning-bolt', color: '#F59E0B' },
    { slug: 'carpentry', name: 'Carpentry', icon: 'saw-blade', color: '#8B5CF6' },
    { slug: 'cleaning', name: 'Cleaning', icon: 'broom', color: '#10B981' },
    { slug: 'painting', name: 'Painting', icon: 'format-paint', color: '#EF4444' },
    { slug: 'ac_repair', name: 'AC Repair', icon: 'air-conditioner', color: '#06B6D4' },
    { slug: 'pest_control', name: 'Pest Control', icon: 'bug', color: '#84CC16' },
    { slug: 'moving', name: 'Moving', icon: 'truck-fast', color: '#F97316' },
    { slug: 'appliance_repair', name: 'Appliance Repair', icon: 'power-plug', color: '#6366F1' },
    { slug: 'gardening', name: 'Gardening', icon: 'leaf', color: '#22C55E' },
    { slug: 'security', name: 'Security Systems', icon: 'shield-check', color: '#64748B' },
    { slug: 'interior', name: 'Interior Design', icon: 'sofa', color: '#EC4899' },
  ]);
});

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

setupSocketHandlers(io);

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 AptiFyx Backend running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🗄️  Database: SQLite\n`);
});
