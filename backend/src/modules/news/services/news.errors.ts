// ======================================================
// TIPOS DE ERRO DE CAMPO
// ======================================================

export type FieldError = {
  field: string;
  code: string;
  message: string;
  meta?: Record<string, any>;
};

// ======================================================
// SERVICE ERROR PADRÃO
// ======================================================

export class ServiceError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(
    message: string,
    statusCode: number = 400,
    errors?: FieldError[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
