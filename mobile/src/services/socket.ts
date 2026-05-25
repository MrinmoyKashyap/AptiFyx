import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Emit helpers ──────────────────────────────────────────────

export function emitProviderUpdateLocation(latitude: number, longitude: number) {
  socket?.emit('provider:update_location', { latitude, longitude });
}

export function emitProviderAcceptJob(jobId: string) {
  socket?.emit('provider:accept_job', { jobId });
}

export function emitProviderCancelJob(jobId: string) {
  socket?.emit('provider:cancel_job', { jobId });
}

export function emitProviderCompleteJob(jobId: string) {
  socket?.emit('provider:complete_job', { jobId });
}

export function emitCustomerBroadcastJob(data: {
  serviceSlug: string;
  serviceName: string;
  latitude: number;
  longitude: number;
  address?: string;
}) {
  socket?.emit('customer:broadcast_job', data);
}

export function emitCustomerCancelJob(jobId: string) {
  socket?.emit('customer:cancel_job', { jobId });
}
