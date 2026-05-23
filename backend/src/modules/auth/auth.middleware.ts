import type { Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';

export { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware.js';

export const requirePlan = (requiredPlan: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401));
      return;
    }

    if (req.user.plan !== requiredPlan && req.user.plan !== 'admin') {
      next(new AppError('Forbidden: Upgrade to access this resource', 403));
      return;
    }

    next();
  };
};
