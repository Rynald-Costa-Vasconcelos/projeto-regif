import { api } from "../lib/api";
import type { AxiosRequestConfig } from "axios";
import {
  normalizeList,
  type PaginationMeta,
} from "../shared/api/contracts";

// =========================
// Types
// =========================

export type DocumentStatus = "PUBLISHED" | "HIDDEN" | "ARCHIVED";

export type DocumentCategoryDTO = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type PublicDocumentItem = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  fileUrl: string;
  mimeType: string;
  originalName?: string | null;
  sizeBytes?: number | null;
  status: DocumentStatus;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  category?: { id: string; name: string; slug: string } | null;

  // admin include
  uploadedBy?: { id: string; name: string } | null;
};

export type ListResult<T> = { items: T[]; meta?: PaginationMeta };

// =========================
// Defaults
// =========================

// ✅ Paginação padrão do ADMIN (fixa)
export const ADMIN_DOCUMENTS_PAGE_SIZE = 20;

// =========================
// Helpers
// =========================

// Mínimo: permitir passar config (ex.: { signal }) sem quebrar o resto
type GetConfig = Pick<AxiosRequestConfig, "signal" | "headers" | "timeout">;

// =========================
// Public API
// =========================

export async function listPublicDocuments(
  params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    categoryId?: string;
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
    date?: string; // YYYY-MM-DD (exato)
    sort?: "newest" | "oldest" | "createdAt:asc" | "createdAt:desc";
  },
  config?: GetConfig
): Promise<ListResult<PublicDocumentItem>> {
  const { data } = await api.get("/documents/public", { params, ...config });
  return normalizeList<PublicDocumentItem>(data);
}

export async function listPublicDocumentCategories(config?: GetConfig) {
  const { data } = await api.get("/documents/public/categories", { ...config });
  return (data?.items ?? []) as DocumentCategoryDTO[];
}

export async function getPublicDocumentBySlug(slug: string, config?: GetConfig) {
  const { data } = await api.get(`/documents/slug/${encodeURIComponent(slug)}`, { ...config });
  return data as PublicDocumentItem;
}

// =========================
// Admin API
// =========================

export async function listAdminDocuments(
  params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: DocumentStatus;
    categoryId?: string;
  },
  config?: GetConfig
) {
  const { data } = await api.get("/documents", { params, ...config });

  // backend novo: { items, meta }
  if (data?.items && Array.isArray(data.items)) return data as { items: PublicDocumentItem[]; meta: PaginationMeta };

  // compat: se ainda vier array
  if (Array.isArray(data)) return { items: data as PublicDocumentItem[], meta: undefined };

  return { items: [] as PublicDocumentItem[], meta: undefined };
}

export async function listAdminDocumentCategories(config?: GetConfig) {
  const { data } = await api.get("/documents/categories", { ...config });
  return (data?.items ?? []) as DocumentCategoryDTO[];
}

export async function createDocument(payload: {
  title: string;
  description?: string;
  categoryId?: string | null;
  status?: DocumentStatus; // default PUBLISHED
  file: File;
}) {
  const form = new FormData();
  form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  if (payload.categoryId) form.append("categoryId", payload.categoryId);
  if (payload.status) form.append("status", payload.status);
  form.append("file", payload.file);

  const { data } = await api.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data as PublicDocumentItem;
}

export async function getAdminDocumentById(id: string, config?: GetConfig) {
  const { data } = await api.get(`/documents/${encodeURIComponent(id)}`, { ...config });
  return data as PublicDocumentItem;
}

export async function updateDocument(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    categoryId?: string | null;
    status?: DocumentStatus;
  }
) {
  const { data } = await api.patch(`/documents/${encodeURIComponent(id)}`, patch);
  return data as PublicDocumentItem;
}

export async function updateDocumentStatus(id: string, status: DocumentStatus) {
  const { data } = await api.patch(`/documents/${encodeURIComponent(id)}/status`, { status });
  return data as PublicDocumentItem;
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${encodeURIComponent(id)}`);
}

export async function createDocumentCategory(payload: {
  name: string;
  sortOrder?: number;
  slug?: string;
}) {
  const { data } = await api.post("/documents/categories", payload);
  return data as DocumentCategoryDTO;
}

export async function updateDocumentCategory(
  id: string,
  patch: {
    name?: string;
    sortOrder?: number;
    slug?: string;
  }
) {
  const { data } = await api.patch(`/documents/categories/${encodeURIComponent(id)}`, patch);
  return data as DocumentCategoryDTO;
}

export async function deleteDocumentCategory(id: string) {
  await api.delete(`/documents/categories/${encodeURIComponent(id)}`);
}
