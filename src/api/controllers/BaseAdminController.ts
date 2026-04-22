import { Request, Response, NextFunction } from 'express';

// Mocking the domain entity for the user
export interface UserEntity {
  id: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STAFF' | 'STUDENT';
}

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
      clerkToken?: string;
    }
  }
}

export abstract class BaseAdminController {
  /**
   * Middleware to ensure the user is an ADMIN.
   * In a real app, this would be a separate middleware function,
   * but we encapsulate it here for the base controller pattern.
   */
  protected requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required', code: 'FORBIDDEN' });
    }

    next();
  }

  /**
   * Standardized success response
   */
  protected success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Standardized error response
   */
  protected error(res: Response, error: string, code = 'INTERNAL_ERROR', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error,
      code,
    });
  }

  /**
   * Wrap async route handlers to catch errors automatically
   */
  protected asyncWrapper(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error('Controller Error:', err);
        this.error(res, err.message || 'An unexpected error occurred', err.code || 'INTERNAL_ERROR', err.statusCode || 500);
      });
    };
  }
}
