import { Request, Response } from 'express';
import { ChatService } from './service';
import { successResponse, errorResponse } from '../../utils/api-response';

export class ChatController {
  private service = new ChatService();

  getMyRooms = async (req: Request, res: Response) => {
    try {
      const rooms = await this.service.getMyRooms(req.user!.userId);
      return successResponse(res, rooms);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getMessages = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const messages = await this.service.getMessages(req.params.roomId, limit, offset);
      return successResponse(res, messages);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  sendMessage = async (req: Request, res: Response) => {
    try {
      const msg = await this.service.sendMessage(req.params.roomId, req.user!.userId, req.body.content);
      return successResponse(res, msg, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
