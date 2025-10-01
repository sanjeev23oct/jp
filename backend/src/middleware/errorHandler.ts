import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiResponse } from '@jp/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  } as ApiResponse);
}

