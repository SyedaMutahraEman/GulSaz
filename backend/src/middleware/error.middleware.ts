import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Route not found', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : 'field';
      return res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists`,
        errors: [{ code: err.code, target }],
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        errors: [{ code: err.code }],
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Database request failed',
      errors: env.NODE_ENV === 'production' ? [] : [{ code: err.code, meta: err.meta }],
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: env.NODE_ENV === 'production' ? [] : [{ detail: err instanceof Error ? err.message : String(err) }],
  });
}
