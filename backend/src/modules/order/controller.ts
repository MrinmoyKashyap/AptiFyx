import { Request, Response } from 'express';
import { OrderService } from './service';
import { LocationService } from '../location/service'; // Import to trigger broadcast
import { successResponse, errorResponse } from '../../utils/api-response';

export class OrderController {
  private service = new OrderService();
  private locationService = new LocationService();

  create = async (req: Request, res: Response) => {
    try {
      const job = await this.service.createJob(req.user!.userId, req.body);
      
      // Trigger radius broadcast
      const broadcastResult = await this.locationService.broadcastJob(
        job.id, 
        req.user!.userId, 
        job.categoryId, 
        job.location.longitude, 
        job.location.latitude
      );

      return successResponse(res, { job, broadcastResult }, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getJob = async (req: Request, res: Response) => {
    try {
      const job = await this.service.getJob(req.params.id);
      if (!job) return errorResponse(res, 'Job not found', 404);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getMyCustomerJobs = async (req: Request, res: Response) => {
    try {
      const jobs = await this.service.getCustomerJobs(req.user!.userId);
      return successResponse(res, jobs);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getMyPartnerJobs = async (req: Request, res: Response) => {
    try {
      const jobs = await this.service.getPartnerJobs(req.user!.userId);
      return successResponse(res, jobs);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  accept = async (req: Request, res: Response) => {
    try {
      const job = await this.service.acceptJob(req.params.id, req.user!.userId);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  start = async (req: Request, res: Response) => {
    try {
      const job = await this.service.startJob(req.params.id, req.user!.userId);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  complete = async (req: Request, res: Response) => {
    try {
      const job = await this.service.completeJob(req.params.id, req.user!.userId);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  confirm = async (req: Request, res: Response) => {
    try {
      const job = await this.service.confirmJob(req.params.id, req.user!.userId);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const job = await this.service.cancelJob(req.params.id, req.user!.userId);
      return successResponse(res, job);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
