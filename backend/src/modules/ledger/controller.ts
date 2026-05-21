import { Request, Response } from 'express';
import { LedgerService } from './service';
import { successResponse, errorResponse } from '../../utils/api-response';

export class LedgerController {
  private service = new LedgerService();

  getWallet = async (req: Request, res: Response) => {
    try {
      const wallet = await this.service.getWallet(req.user!.userId);
      return successResponse(res, wallet);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getTransactions = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const transactions = await this.service.getTransactions(req.user!.userId, limit, offset);
      return successResponse(res, transactions);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
