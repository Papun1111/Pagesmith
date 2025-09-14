import type { Request, Response, NextFunction } from 'express';
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.error('An unhandled error occurred:', err.stack);


  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;


  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred on the server.',

    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
