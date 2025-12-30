import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Invalid input', details: error.flatten() });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
