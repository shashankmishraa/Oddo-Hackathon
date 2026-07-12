import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, error: any, message = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: typeof error === 'string' ? { message: error } : error,
  });
};
