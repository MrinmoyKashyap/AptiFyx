import { Request, Response } from 'express';
import { IdentityService } from './service';
import { successResponse, errorResponse } from '../../utils/api-response';

export class IdentityController {
  private service = new IdentityService();

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.service.register(req.body);
      return successResponse(res, result, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.service.login(req.body);
      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message, 401);
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      const user = await this.service.getProfile(req.user!.userId);
      return successResponse(res, user);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  switchMode = async (req: Request, res: Response) => {
    try {
      const user = await this.service.switchMode(req.user!.userId, req.body.mode);
      return successResponse(res, user);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  setupPartner = async (req: Request, res: Response) => {
    try {
      const { skills, bio, hourlyRate } = req.body;
      const profile = await this.service.setupPartner(req.user!.userId, skills, bio, hourlyRate);
      return successResponse(res, profile);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getPartnerProfile = async (req: Request, res: Response) => {
    try {
      const profile = await this.service.getPartnerProfile(req.params.id);
      if (!profile) return errorResponse(res, 'Partner not found', 404);
      return successResponse(res, profile);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
