import { ServiceRequestModel, IServiceRequest } from './model';
import { JobStatus, EventType } from '@aptifyx/shared-types';
import { eventBus } from '../../events/event-bus';

export class OrderService {
  async createJob(customerId: string, data: any): Promise<IServiceRequest> {
    const job = new ServiceRequestModel({
      ...data,
      customerId,
      status: JobStatus.BROADCASTED,
      statusHistory: [{ status: JobStatus.BROADCASTED }]
    });
    await job.save();

    // Trigger matchmaking (this could be done via event bus, but doing it directly or via event)
    // Actually, letting the Event Bus handle it decouples perfectly.
    // Wait, Location Service is responsible for broadcasting. 
    // We will emit an event that triggers Location Service to do the radius expansion broadcast.
    
    // For MVP, we can also just let the controller call LocationService, but EventBus is cleaner.
    // We will emit JOB_CREATED (wait, we didn't define JOB_CREATED in events. Let's just do it directly or add an event).
    // Let's use the controller to trigger broadcast to keep it simple, or add a custom event handler later.
    
    return job;
  }

  async getJob(id: string) {
    return ServiceRequestModel.findById(id);
  }

  async getCustomerJobs(customerId: string) {
    return ServiceRequestModel.find({ customerId }).sort({ createdAt: -1 });
  }

  async getPartnerJobs(partnerId: string) {
    return ServiceRequestModel.find({ partnerId }).sort({ createdAt: -1 });
  }

  async acceptJob(jobId: string, partnerId: string): Promise<IServiceRequest> {
    const job = await ServiceRequestModel.findById(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== JobStatus.BROADCASTED) throw new Error('Job is no longer available');

    job.partnerId = partnerId;
    job.status = JobStatus.ACCEPTED;
    job.statusHistory.push({ status: JobStatus.ACCEPTED, timestamp: new Date().toISOString() });
    await job.save();

    await eventBus.publish({
      type: EventType.JOB_ACCEPTED,
      payload: { jobId: job.id, customerId: job.customerId, partnerId, amount: job.offeredAmount },
      timestamp: new Date().toISOString()
    });

    return job;
  }

  async startJob(jobId: string, partnerId: string): Promise<IServiceRequest> {
    const job = await this.updateStatus(jobId, partnerId, JobStatus.ACCEPTED, JobStatus.IN_PROGRESS);
    await eventBus.publish({
      type: EventType.JOB_STARTED,
      payload: { jobId: job.id, customerId: job.customerId, partnerId },
      timestamp: new Date().toISOString()
    });
    return job;
  }

  async completeJob(jobId: string, partnerId: string): Promise<IServiceRequest> {
    const job = await this.updateStatus(jobId, partnerId, JobStatus.IN_PROGRESS, JobStatus.COMPLETED);
    await eventBus.publish({
      type: EventType.JOB_COMPLETED,
      payload: { jobId: job.id, customerId: job.customerId, partnerId },
      timestamp: new Date().toISOString()
    });
    return job;
  }

  async confirmJob(jobId: string, customerId: string): Promise<IServiceRequest> {
    const job = await ServiceRequestModel.findById(jobId);
    if (!job || job.customerId !== customerId) throw new Error('Unauthorized or not found');
    if (job.status !== JobStatus.COMPLETED) throw new Error('Job cannot be confirmed yet');

    job.status = JobStatus.CONFIRMED;
    job.statusHistory.push({ status: JobStatus.CONFIRMED, timestamp: new Date().toISOString() });
    await job.save();

    await eventBus.publish({
      type: EventType.JOB_CONFIRMED,
      payload: { jobId: job.id, customerId: job.customerId, partnerId: job.partnerId, amount: job.offeredAmount },
      timestamp: new Date().toISOString()
    });

    return job;
  }

  async cancelJob(jobId: string, userId: string): Promise<IServiceRequest> {
    const job = await ServiceRequestModel.findById(jobId);
    if (!job || (job.customerId !== userId && job.partnerId !== userId)) {
      throw new Error('Unauthorized or not found');
    }
    
    if ([JobStatus.COMPLETED, JobStatus.CONFIRMED].includes(job.status)) {
      throw new Error('Cannot cancel a completed job');
    }

    job.status = JobStatus.CANCELLED;
    job.statusHistory.push({ status: JobStatus.CANCELLED, timestamp: new Date().toISOString(), note: \`Cancelled by \${userId}\` });
    await job.save();

    await eventBus.publish({
      type: EventType.JOB_CANCELLED,
      payload: { jobId: job.id, customerId: job.customerId, partnerId: job.partnerId, amount: job.offeredAmount },
      timestamp: new Date().toISOString()
    });

    return job;
  }

  private async updateStatus(jobId: string, partnerId: string, expectedCurrent: JobStatus, next: JobStatus) {
    const job = await ServiceRequestModel.findById(jobId);
    if (!job || job.partnerId !== partnerId) throw new Error('Unauthorized or not found');
    if (job.status !== expectedCurrent) throw new Error(\`Job must be \${expectedCurrent} to transition to \${next}\`);

    job.status = next;
    job.statusHistory.push({ status: next, timestamp: new Date().toISOString() });
    await job.save();
    return job;
  }
}
