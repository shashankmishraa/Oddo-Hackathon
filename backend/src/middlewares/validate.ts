import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.reduce((acc: any, curr) => {
          const key = curr.path.slice(1).join('.') || curr.path[0];
          acc[key] = curr.message;
          return acc;
        }, {});
        return next(new AppError('Validation Error', 400, formattedErrors));
      }
      return next(error);
    }
  };
};
export default validate;
