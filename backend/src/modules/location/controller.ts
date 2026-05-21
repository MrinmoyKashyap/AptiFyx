import { Request, Response } from 'express';
import { LocationService } from './service';
import { successResponse, errorResponse } from '../../utils/api-response';

export class LocationController {
  private service = new LocationService();

  updateLocation = async (req: Request, res: Response) => {
    try {
      const { longitude, latitude } = req.body;
      await this.service.updateLocation(req.user!.userId, longitude, latitude);
      return successResponse(res, { message: 'Location updated' });
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getNearby = async (req: Request, res: Response) => {
    try {
      // Cast safely since they are pre-validated by Zod
      const latitude = req.query.latitude as unknown as number;
      const longitude = req.query.longitude as unknown as number;
      const radiusKm = req.query.radiusKm as unknown as number;
      const categoryId = req.query.categoryId as string | undefined;

      const results = await this.service.getNearbyPartners(longitude, latitude, radiusKm, categoryId);
      return successResponse(res, results);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  broadcast = async (req: Request, res: Response) => {
    try {
      const { jobId, categoryId, longitude, latitude } = req.body;
      // In reality, this endpoint might be called internally by OrderService via Pub/Sub,
      // but it's good to expose it for testing/admin.
      const result = await this.service.broadcastJob(jobId, req.user!.userId, categoryId, longitude, latitude);
      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
