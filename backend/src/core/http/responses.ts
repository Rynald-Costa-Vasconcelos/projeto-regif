import type { Response } from "express";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function sendData<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function sendList<T>(res: Response, items: T[], meta?: PaginationMeta, status = 200) {
  return res.status(status).json({ items, meta: meta ?? null });
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
