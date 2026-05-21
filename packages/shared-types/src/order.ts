import { GeoPoint } from './geo';

export enum JobStatus {
  BROADCASTED = 'broadcasted',   // Customer created request, finding partners
  ACCEPTED = 'accepted',         // Partner accepted, en route
  IN_PROGRESS = 'in_progress',   // Partner arrived, working
  COMPLETED = 'completed',       // Partner marked done
  CONFIRMED = 'confirmed',       // Customer confirmed completion -> triggers payment
  CANCELLED = 'cancelled',       // Either party cancelled
  DISPUTED = 'disputed'          // Customer raised issue
}

export interface JobStatusHistory {
  status: JobStatus;
  timestamp: string;
  note?: string;
}

export interface JobRating {
  customerToPartner?: number;
  partnerToCustomer?: number;
  review?: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  partnerId?: string;
  categoryId: string; // Refers to ServiceCategory.id
  description: string;
  location: GeoPoint;
  offeredAmount: number;
  status: JobStatus;
  statusHistory: JobStatusHistory[];
  rating?: JobRating;
  createdAt: string;
  updatedAt: string;
}
