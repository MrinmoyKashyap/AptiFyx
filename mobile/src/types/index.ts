export type UserRole = 'customer' | 'provider';

export interface User {
  id: string;
  name: string;
  phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  services: string[];
  isOnline: boolean;
  rating: number;
  totalJobsDone: number;
  pendingCommission: number;
  unpaidJobCount: number;
}

export interface Service {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

export type JobStatus =
  | 'broadcasting'
  | 'accepted'
  | 'otp_verified'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_provider';

export interface Job {
  id: string;
  customerId: string;
  providerId?: string;
  serviceSlug: string;
  serviceName: string;
  status: JobStatus;
  startOtp?: string;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: string;
  provider?: Provider;
}

export interface IncomingJobNotification {
  jobId: string;
  serviceSlug: string;
  serviceName: string;
  latitude: number;
  longitude: number;
  address?: string;
  customerName: string;
  distanceKm: number;
  radiusKm: number;
}

export interface Commission {
  id: string;
  providerId: string;
  jobId?: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
}
