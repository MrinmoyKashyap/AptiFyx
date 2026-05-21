import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/api-response';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }

  return errorResponse(res, 'Internal Server Error', 500);
};
