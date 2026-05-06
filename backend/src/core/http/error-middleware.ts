import type { NextFunction, Request, Response } from "express";
import { asAppError } from "./errors";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const appError = asAppError(err);

  if (appError.statusCode >= 500) {
    console.error("[api:error]", err);
  }

  return res.status(appError.statusCode).json({
    code: appError.code,
    message: appError.message,
    details: appError.details ?? null,
  });
}
