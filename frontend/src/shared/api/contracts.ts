import type { AxiosError } from "axios";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiError = {
  status?: number;
  message: string;
  code?: string;
  details?: unknown;
  raw?: unknown;
};

export function toApiError(err: unknown, fallbackMessage = "Erro inesperado"): ApiError {
  const ax = err as AxiosError<any> | undefined;

  if (ax && typeof ax === "object" && "isAxiosError" in ax) {
    const status = ax.response?.status;
    const data = ax.response?.data;

    const message =
      (data && typeof data === "object" && (data.message || data.error || data.erro)) ||
      (typeof data === "string" ? data : undefined) ||
      ax.message ||
      fallbackMessage;

    const details = data?.detalhes ?? data?.details ?? data?.issues ?? data?.errors;
    const code = data?.code;

    return {
      status,
      message: String(message),
      code: typeof code === "string" ? code : undefined,
      details,
      raw: data ?? ax,
    };
  }

  if (err instanceof Error) {
    return { message: err.message || fallbackMessage, raw: err };
  }

  return { message: fallbackMessage, raw: err };
}

export function normalizeList<T>(payload: any): { items: T[]; meta?: PaginationMeta } {
  if (payload && typeof payload === "object" && Array.isArray(payload.items)) {
    return { items: payload.items as T[], meta: payload.meta as PaginationMeta | undefined };
  }

  if (payload?.data && Array.isArray(payload.data)) return { items: payload.data as T[] };
  if (Array.isArray(payload)) return { items: payload as T[] };
  return { items: [] };
}
