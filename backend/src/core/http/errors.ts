import { ZodError } from "zod";

export type FieldError = {
  field: string;
  code: string;
  message: string;
  meta?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(params: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;
  }
}

export function zodToFieldErrors(err: ZodError): FieldError[] {
  return err.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    code: "invalid",
    message: issue.message,
  }));
}

export function fromZodError(err: ZodError, message = "Dados inválidos") {
  return new AppError({
    message,
    code: "validation_error",
    statusCode: 400,
    details: zodToFieldErrors(err),
  });
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error && typeof error === "object") {
    const maybe = error as {
      message?: unknown;
      statusCode?: unknown;
      errors?: unknown;
      details?: unknown;
      code?: unknown;
    };

    if (typeof maybe.statusCode === "number") {
      return new AppError({
        message: typeof maybe.message === "string" ? maybe.message : "Falha na requisição",
        code: typeof maybe.code === "string" ? maybe.code : "request_error",
        statusCode: maybe.statusCode,
        details: maybe.details ?? maybe.errors,
      });
    }
  }

  return new AppError({
    message: error instanceof Error ? error.message : "Erro interno do servidor",
    code: "internal_error",
    statusCode: 500,
  });
}
