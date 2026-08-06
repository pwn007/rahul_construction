import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

/** Thrown by services; converted to a JSON response by the error handler. */
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, status: 404 },
  });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: { message: 'Validation failed', status: 422, details: err.flatten() },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, status: err.status, details: err.details } });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[error]', err);
  res.status(500).json({ error: { message, status: 500 } });
};

/** Wraps an async handler so rejections reach the error middleware. */
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };

/** Validates `req.body` against a Zod schema before the handler runs. */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };

/**
 * Minimal in-memory rate limiter for write endpoints.
 * Phase 2 replaces this with Redis-backed limiting behind a load balancer.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimit =
  (max = 30, windowMs = 60_000) =>
  (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429).json({ error: { message: 'Too many requests. Please slow down.', status: 429 } });
      return;
    }

    next();
  };
