import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodType } from "zod";
import { fromZodError } from "./errors";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncController): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

export function parseBody<T>(schema: ZodType<T>, req: Request): T {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw fromZodError(parsed.error);
  return parsed.data;
}
