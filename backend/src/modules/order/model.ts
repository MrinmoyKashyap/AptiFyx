import mongoose, { Schema, Document } from 'mongoose';
import { JobStatus, JobStatusHistory, JobRating, GeoPoint } from '@aptifyx/shared-types';

export interface IServiceRequest extends Document {
  customerId: string;
  partnerId?: string;
  categoryId: string;
  description: string;
  location: GeoPoint;
  offeredAmount: number;
  status: JobStatus;
  statusHistory: JobStatusHistory[];
  rating?: JobRating;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema(
  {
    customerId: { type: String, required: true, index: true },
    partnerId: { type: String, index: true },
    categoryId: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    offeredAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: Object.values(JobStatus), 
      default: JobStatus.BROADCASTED,
      index: true
    },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(JobStatus) },
        timestamp: { type: Date, default: Date.now },
        note: String
      }
    ],
    rating: {
      customerToPartner: { type: Number, min: 1, max: 5 },
      partnerToCustomer: { type: Number, min: 1, max: 5 },
      review: String
    }
  },
  { timestamps: true }
);

export const ServiceRequestModel = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
