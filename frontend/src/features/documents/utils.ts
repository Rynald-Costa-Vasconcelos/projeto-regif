import type { PaginationMeta } from "./types";
import type { PublicDocumentItem } from "../../services/documentService";

export function toISODateOnly(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateBR(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function pickDateForDisplay(doc: PublicDocumentItem) {
  return doc.publishedAt ?? doc.createdAt;
}

export function normalizeMeta(
  meta: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
  itemsLen: number
): PaginationMeta {
  if (meta && typeof meta === "object") {
    const m = meta as Partial<PaginationMeta>;
    const page = Number(m.page ?? fallbackPage);
    const pageSize = Number(m.pageSize ?? fallbackPageSize);
    const total = Number(m.total ?? itemsLen);
    const totalPages = Number(
      m.totalPages ?? Math.max(1, Math.ceil(total / pageSize))
    );
    return { page, pageSize, total, totalPages };
  }

  return {
    page: fallbackPage,
    pageSize: fallbackPageSize,
    total: itemsLen,
    totalPages: 1,
  };
}

export function safeClampPage(p: number, totalPages: number) {
  return Math.min(Math.max(1, p), Math.max(1, totalPages));
}

export function openCountingUrl(countingUrl: string, filename?: string | null) {
  const a = document.createElement("a");
  a.href = countingUrl;
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
