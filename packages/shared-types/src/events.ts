export enum EventType {
  JOB_BROADCASTED = 'JOB_BROADCASTED',
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  JOB_STARTED = 'JOB_STARTED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_CONFIRMED = 'JOB_CONFIRMED',
  JOB_CANCELLED = 'JOB_CANCELLED',
  PARTNER_LOCATION_UPDATE = 'PARTNER_LOCATION_UPDATE',
  ESCROW_HELD = 'ESCROW_HELD',
  ESCROW_RELEASED = 'ESCROW_RELEASED',
  ESCROW_REFUNDED = 'ESCROW_REFUNDED',
  CHAT_MESSAGE_SENT = 'CHAT_MESSAGE_SENT',
  PARTNER_AVAILABILITY_CHANGED = 'PARTNER_AVAILABILITY_CHANGED'
}

export interface DomainEvent<T> {
  type: EventType;
  payload: T;
  timestamp: string;
  correlationId?: string; // Often the Job ID
}

// Specific payloads
export interface JobBroadcastPayload {
  jobId: string;
  customerId: string;
  categoryId: string;
  matchedPartnerIds: string[]; // Redis GEOSEARCH matches
  radiusKm: number;
}
