import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  errors: any;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  logger.error(`Error occurred on ${req.method} ${req.url} - ${message}`, err);

  return sendError(res, errors || { details: err.message }, message, statusCode);
};
export default errorHandler;
