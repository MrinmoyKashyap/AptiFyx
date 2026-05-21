import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ActiveMode, UserRole } from '@aptifyx/shared-types';
import { errorResponse } from '../utils/api-response';

export interface AuthPayload {
  userId: string;
  activeMode: ActiveMode;
  roles: UserRole[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized - Missing Token', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Unauthorized - Invalid Token', 401);
  }
};
