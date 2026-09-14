import { Request, Response, NextFunction } from "express";

// ─── Typed API response helpers ───────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
}

// ─── Global error handler middleware ─────────────────────────────────────────

export function errorHandler(
  err: Error & { status?: number; code?: number },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error("[Error]", err.message);

  if (err.name === "ValidationError") {
    sendError(res, "Validation failed", 400, err.message);
    return;
  }

  if (err.name === "CastError") {
    sendError(res, "Invalid ID format", 400);
    return;
  }

  if (err.code === 11000) {
    sendError(res, "Duplicate key error", 409);
    return;
  }

  sendError(res, err.message || "Internal server error", err.status || 500);
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

export function notFound(req: Request, res: Response): void {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
