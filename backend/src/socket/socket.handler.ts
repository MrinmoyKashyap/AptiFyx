import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { haversineDistance, generateOtp } from '../utils/geo';

const COMMISSION_AMOUNT = Number(process.env.COMMISSION_AMOUNT) || 20;
const MAX_UNPAID_JOBS = Number(process.env.MAX_UNPAID_JOBS) || 2;
const INITIAL_RADIUS_KM = Number(process.env.BROADCAST_RADIUS_KM) || 5;
const MAX_RADIUS_KM = Number(process.env.BROADCAST_MAX_RADIUS_KM) || 20;
const EXPAND_INTERVAL_MS = Number(process.env.BROADCAST_EXPAND_SECONDS) * 1000 || 30000;

interface AuthPayload {
  id: string;
  role: 'customer' | 'provider';
  phone: string;
}

// Track active broadcast timers
const broadcastTimers = new Map<string, NodeJS.Timeout>();
// Track provider socket -> provider data
const providerSocketMap = new Map<string, { providerId: string; latitude: number; longitude: number; services: string[] }>();
// Track customer socket -> job
const customerSocketMap = new Map<string, { customerId: string; jobId: string }>();

export function setupSocketHandlers(io: Server) {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    console.log(`[Socket] Connected: ${user.role} ${user.id} (${socket.id})`);

    if (user.role === 'provider') {
      await handleProviderConnect(io, socket, user);
    } else {
      await handleCustomerConnect(io, socket, user);
    }

    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${user.role} ${user.id}`);
      if (user.role === 'provider') {
        await handleProviderDisconnect(io, socket, user);
      } else {
        handleCustomerDisconnect(socket);
      }
    });

    // ── PROVIDER EVENTS ──
    socket.on('provider:update_location', async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (user.role !== 'provider') return;
      await prisma.provider.update({
        where: { id: user.id },
        data: { latitude, longitude },
      });
      const existing = providerSocketMap.get(socket.id);
      if (existing) {
        providerSocketMap.set(socket.id, { ...existing, latitude, longitude });
      }
    });

    socket.on('provider:accept_job', async ({ jobId }: { jobId: string }) => {
      if (user.role !== 'provider') return;
      await handleJobAccept(io, socket, user, jobId);
    });

    socket.on('provider:cancel_job', async ({ jobId }: { jobId: string }) => {
      if (user.role !== 'provider') return;
      await handleProviderCancelJob(io, socket, user, jobId);
    });

    socket.on('provider:complete_job', async ({ jobId }: { jobId: string }) => {
      if (user.role !== 'provider') return;
      await handleJobComplete(io, socket, user, jobId);
    });

    // ── CUSTOMER EVENTS ──
    socket.on('customer:broadcast_job', async (data: {
      serviceSlug: string;
      serviceName: string;
      latitude: number;
      longitude: number;
      address?: string;
    }) => {
      if (user.role !== 'customer') return;
      await handleJobBroadcast(io, socket, user, data);
    });

    socket.on('customer:cancel_job', async ({ jobId }: { jobId: string }) => {
      if (user.role !== 'customer') return;
      await handleCustomerCancelJob(io, socket, user, jobId);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Provider connect / disconnect
// ─────────────────────────────────────────────────────────────

async function handleProviderConnect(io: Server, socket: Socket, user: AuthPayload) {
  const provider = await prisma.provider.findUnique({ where: { id: user.id } });
  if (!provider) return;

  const services = JSON.parse(provider.services || '[]') as string[];
  await prisma.provider.update({
    where: { id: user.id },
    data: { socketId: socket.id },
  });

  const fallbackLat = provider.latitude || 28.6139;
  const fallbackLon = provider.longitude || 77.2090;

  providerSocketMap.set(socket.id, {
    providerId: user.id,
    latitude: fallbackLat,
    longitude: fallbackLon,
    services,
  });

  socket.emit('provider:connected', {
    providerId: user.id,
    isOnline: provider.isOnline,
    pendingCommission: provider.pendingCommission,
    unpaidJobCount: provider.unpaidJobCount,
  });
}

async function handleProviderDisconnect(io: Server, socket: Socket, user: AuthPayload) {
  providerSocketMap.delete(socket.id);
  await prisma.provider.update({
    where: { id: user.id },
    data: { socketId: null },
  }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────
// Customer connect / disconnect
// ─────────────────────────────────────────────────────────────

async function handleCustomerConnect(io: Server, socket: Socket, user: AuthPayload) {
  // Restore active job tracking if customer reconnects mid-job
  const activeJob = await prisma.job.findFirst({
    where: {
      customerId: user.id,
      status: { in: ['broadcasting', 'accepted', 'in_progress'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (activeJob) {
    customerSocketMap.set(socket.id, { customerId: user.id, jobId: activeJob.id });
    await prisma.job.update({
      where: { id: activeJob.id },
      data: { customerSocketId: socket.id },
    });
    socket.emit('customer:job_restored', { job: activeJob });
  }
}

function handleCustomerDisconnect(socket: Socket) {
  customerSocketMap.delete(socket.id);
}

// ─────────────────────────────────────────────────────────────
// Broadcast logic with expanding radius
// ─────────────────────────────────────────────────────────────

async function handleJobBroadcast(
  io: Server,
  socket: Socket,
  user: AuthPayload,
  data: { serviceSlug: string; serviceName: string; latitude: number; longitude: number; address?: string }
) {
  // Cancel any existing job
  await prisma.job.updateMany({
    where: {
      customerId: user.id,
      status: { in: ['broadcasting', 'accepted', 'in_progress'] },
    },
    data: { status: 'cancelled_by_customer' },
  });

  const job = await prisma.job.create({
    data: {
      customerId: user.id,
      serviceSlug: data.serviceSlug,
      serviceName: data.serviceName,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      status: 'broadcasting',
      customerSocketId: socket.id,
    },
  });

  customerSocketMap.set(socket.id, { customerId: user.id, jobId: job.id });

  socket.emit('customer:job_created', { jobId: job.id });

  // Start broadcasting with expanding radius
  await broadcastToNearbyProviders(io, job.id, data.serviceSlug, data.latitude, data.longitude, INITIAL_RADIUS_KM);
  scheduleRadiusExpansion(io, job.id, data.serviceSlug, data.latitude, data.longitude, INITIAL_RADIUS_KM);
}

async function broadcastToNearbyProviders(
  io: Server,
  jobId: string,
  serviceSlug: string,
  lat: number,
  lon: number,
  radiusKm: number
) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { user: true } });
  if (!job || job.status !== 'broadcasting') return;

  let notified = 0;
  for (const [socketId, providerData] of providerSocketMap) {
    if (!providerData.services.includes(serviceSlug)) continue;
    const dist = haversineDistance(lat, lon, providerData.latitude, providerData.longitude);
    if (dist <= radiusKm) {
      // Check provider is online and can accept jobs
      const provider = await prisma.provider.findUnique({ where: { id: providerData.providerId } });
      if (!provider?.isOnline) continue;
      if (provider.unpaidJobCount > MAX_UNPAID_JOBS) continue;

      io.to(socketId).emit('provider:new_job', {
        jobId: job.id,
        serviceSlug: job.serviceSlug,
        serviceName: job.serviceName,
        latitude: job.latitude,
        longitude: job.longitude,
        address: job.address,
        customerName: job.user.name,
        distanceKm: Math.round(dist * 10) / 10,
        radiusKm,
      });
      notified++;
    }
  }

  // Notify customer of broadcast status
  if (job.customerSocketId) {
    io.to(job.customerSocketId).emit('customer:broadcast_status', {
      jobId,
      radiusKm,
      providersNotified: notified,
    });
  }

  console.log(`[Matchmaking] Job ${jobId}: ${notified} providers notified within ${radiusKm}km`);
}

function scheduleRadiusExpansion(
  io: Server,
  jobId: string,
  serviceSlug: string,
  lat: number,
  lon: number,
  currentRadius: number
) {
  if (currentRadius >= MAX_RADIUS_KM) return;
  const timer = setTimeout(async () => {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'broadcasting') return;

    const newRadius = Math.min(currentRadius + 5, MAX_RADIUS_KM);
    await broadcastToNearbyProviders(io, jobId, serviceSlug, lat, lon, newRadius);
    scheduleRadiusExpansion(io, jobId, serviceSlug, lat, lon, newRadius);
  }, EXPAND_INTERVAL_MS);

  broadcastTimers.set(jobId, timer);
}

function clearBroadcastTimer(jobId: string) {
  const timer = broadcastTimers.get(jobId);
  if (timer) {
    clearTimeout(timer);
    broadcastTimers.delete(jobId);
  }
}

// ─────────────────────────────────────────────────────────────
// Accept job
// ─────────────────────────────────────────────────────────────

async function handleJobAccept(io: Server, socket: Socket, user: AuthPayload, jobId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: user.id } });
  if (!provider) return socket.emit('error', { message: 'Provider not found' });
  if (!provider.isOnline) return socket.emit('error', { message: 'You are offline' });
  if (provider.unpaidJobCount > MAX_UNPAID_JOBS) {
    return socket.emit('error', { message: 'Pay pending commission to accept more jobs' });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { user: true } });
  if (!job || job.status !== 'broadcasting') {
    return socket.emit('provider:job_unavailable', { jobId });
  }

  const otp = generateOtp();

  await prisma.job.update({
    where: { id: jobId },
    data: { providerId: user.id, status: 'accepted', startOtp: otp },
  });

  clearBroadcastTimer(jobId);

  // Remove job from other providers
  io.emit('provider:job_taken', { jobId });

  // Notify provider
  socket.emit('provider:job_accepted_confirm', {
    jobId,
    customerName: job.user.name,
    customerPhone: job.user.phone,
    latitude: job.latitude,
    longitude: job.longitude,
    address: job.address,
    serviceName: job.serviceName,
  });

  // Notify customer
  if (job.customerSocketId) {
    io.to(job.customerSocketId).emit('customer:provider_accepted', {
      jobId,
      otp,
      provider: {
        id: provider.id,
        name: provider.name,
        phone: provider.phone,
        rating: provider.rating,
        totalJobsDone: provider.totalJobsDone,
        latitude: provider.latitude,
        longitude: provider.longitude,
      },
    });
  }

  console.log(`[Matchmaking] Job ${jobId} accepted by provider ${user.id}. OTP: ${otp}`);
}

// ─────────────────────────────────────────────────────────────
// Cancel by provider
// ─────────────────────────────────────────────────────────────

async function handleProviderCancelJob(io: Server, socket: Socket, user: AuthPayload, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { user: true } });
  if (!job || job.providerId !== user.id) return;

  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'broadcasting', providerId: null, startOtp: null },
  });

  socket.emit('provider:cancel_confirmed', { jobId });

  // Notify customer, re-broadcast
  if (job.customerSocketId) {
    io.to(job.customerSocketId).emit('customer:provider_cancelled', {
      jobId,
      message: 'Provider cancelled. Re-broadcasting your request...',
    });
  }

  // Re-broadcast
  await broadcastToNearbyProviders(io, jobId, job.serviceSlug, job.latitude, job.longitude, INITIAL_RADIUS_KM);
  scheduleRadiusExpansion(io, jobId, job.serviceSlug, job.latitude, job.longitude, INITIAL_RADIUS_KM);
}

// ─────────────────────────────────────────────────────────────
// Cancel by customer
// ─────────────────────────────────────────────────────────────

async function handleCustomerCancelJob(io: Server, socket: Socket, user: AuthPayload, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.customerId !== user.id) return;

  clearBroadcastTimer(jobId);
  await prisma.job.update({ where: { id: jobId }, data: { status: 'cancelled_by_customer' } });

  socket.emit('customer:job_cancelled', { jobId });

  // Notify provider if any
  if (job.providerId) {
    const provider = await prisma.provider.findUnique({ where: { id: job.providerId } });
    if (provider?.socketId) {
      io.to(provider.socketId).emit('provider:customer_cancelled', { jobId });
    }
  }

  // Remove from all providers' screens
  io.emit('provider:job_taken', { jobId });
}

// ─────────────────────────────────────────────────────────────
// Complete job
// ─────────────────────────────────────────────────────────────

async function handleJobComplete(io: Server, socket: Socket, user: AuthPayload, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { user: true } });
  if (!job || job.providerId !== user.id) return;
  if (!['accepted', 'in_progress'].includes(job.status)) return;

  await prisma.job.update({ where: { id: jobId }, data: { status: 'completed' } });

  // Create commission record
  await prisma.commission.create({
    data: {
      providerId: user.id,
      jobId,
      amount: COMMISSION_AMOUNT,
      status: 'pending',
    },
  });

  // Update provider stats
  const provider = await prisma.provider.update({
    where: { id: user.id },
    data: {
      totalJobsDone: { increment: 1 },
      pendingCommission: { increment: COMMISSION_AMOUNT },
      unpaidJobCount: { increment: 1 },
    },
  });

  const canAcceptMore = provider.unpaidJobCount <= MAX_UNPAID_JOBS;

  socket.emit('provider:job_completed', {
    jobId,
    commissionDue: COMMISSION_AMOUNT,
    totalPending: provider.pendingCommission,
    unpaidJobCount: provider.unpaidJobCount,
    canAcceptMoreJobs: canAcceptMore,
  });

  // Notify customer
  if (job.customerSocketId) {
    io.to(job.customerSocketId).emit('customer:job_completed', {
      jobId,
      providerName: (await prisma.provider.findUnique({ where: { id: user.id } }))?.name,
    });
  }
}
