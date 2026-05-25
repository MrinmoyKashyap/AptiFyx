import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Replace with your machine's local IP when testing on device
export const API_BASE_URL = 'http://192.168.1.22:3001'; // Physical Device
// export const API_BASE_URL = 'http://localhost:3001'; // iOS simulator

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────

export const sendOtp = (phone: string, role: 'customer' | 'provider') =>
  api.post('/auth/send-otp', { phone, role });

export const verifyCustomerOtp = (data: {
  phone: string;
  otp: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) => api.post('/auth/customer/verify-otp', data);

export const verifyProviderOtp = (data: {
  phone: string;
  otp: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
}) => api.post('/auth/provider/verify-otp', data);

export const updateProfile = (data: object) => api.put('/auth/profile', data);

// ── Services ──────────────────────────────────────────────────

export const getServices = () => api.get('/services');

// ── Jobs ──────────────────────────────────────────────────────

export const getActiveJob = () => api.get('/jobs/active');

export const broadcastJob = (data: {
  serviceSlug: string;
  serviceName: string;
  latitude: number;
  longitude: number;
  address?: string;
}) => api.post('/jobs/broadcast', data);

export const cancelJob = (jobId: string) => api.post(`/jobs/${jobId}/cancel`);

export const verifyJobOtp = (jobId: string, otp: string) =>
  api.post(`/jobs/${jobId}/verify-otp`, { otp });

export const getJobHistory = () => api.get('/jobs/history');

// ── Provider ──────────────────────────────────────────────────

export const getProviderProfile = () => api.get('/providers/me');

export const toggleProviderStatus = (isOnline: boolean) =>
  api.post('/providers/toggle-status', { isOnline });

export const updateProviderLocation = (latitude: number, longitude: number) =>
  api.post('/providers/location', { latitude, longitude });

export const updateProviderServices = (services: string[]) =>
  api.put('/providers/services', { services });

export const getProviderJobs = () => api.get('/providers/jobs');

export const getProviderEarnings = () => api.get('/providers/earnings');

// ── Payments ──────────────────────────────────────────────────

export const getPendingCommissions = () => api.get('/payments/pending');

export const payCommission = (options: { commissionIds?: string[]; payAll?: boolean }) =>
  api.post('/payments/pay', options);

export const payLater = () => api.post('/payments/pay-later');

export default api;
