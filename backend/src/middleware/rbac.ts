import { Request, Response, NextFunction } from 'express';
import { ActiveMode, UserRole } from '@aptifyx/shared-types';
import { errorResponse } from '../utils/api-response';

export const requireMode = (mode: ActiveMode) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    
    if (req.user.activeMode !== mode) {
      return errorResponse(res, `Forbidden - Requires ${mode} mode`, 403);
    }

    next();
  };
};

export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    
    if (!req.user.roles.includes(role)) {
      return errorResponse(res, `Forbidden - Requires ${role} role`, 403);
    }

    next();
  };
};
