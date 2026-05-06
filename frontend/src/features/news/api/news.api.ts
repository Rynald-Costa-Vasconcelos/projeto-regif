// src/features/news/api/news.api.ts
import { api } from "../../../lib/api";
import { getImageSize } from "../utils"; // Importante para validação de imagem no upload
import type {
  ApiError,
  PaginationMeta,
  PublicNewsItem,
  PublicListResult,
  PublicNewsArchiveParams,
  AdminListResult,
  AdminNewsItem,
  AdminNewsListParams,
  PublicNewsDetail,
  NewsCategoryDTO,
  NewsLinkDTO,
  PostStatus,
} from "../types";
import { ADMIN_NEWS_PAGE_SIZE } from "../types";

const REQUEST_TIMEOUT = 10000;
type RecordLike = Record<string, unknown>;

/** Se vier URL relativa (/uploads/...), usa o mesmo host do frontend */
function absUrl(u?: string | null) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${window.location.origin}${u.startsWith("/") ? "" : "/"}${u}`;
}

function normalizeList<T>(data: unknown): { items: T[]; meta?: PaginationMeta } {
  if (Array.isArray(data)) return { items: data as T[] };

  if (data && typeof data === "object") {
    const obj = data as RecordLike;
    if (Array.isArray(obj.items)) {
      return {
        items: obj.items as T[],
        meta: obj.meta as PaginationMeta | undefined,
      };
    }
    if (Array.isArray(obj.data)) {
      return { items: obj.data as T[] };
    }
  }

  return { items: [] };
}

function normalizePublicNewsItem(raw: unknown): PublicNewsItem {
  const item = (raw ?? {}) as PublicNewsItem;
  const coverFromAsset = item.coverAsset?.url ?? item.coverAsset?.thumbUrl ?? null;
  const coverImageUrl = absUrl(item.coverImageUrl ?? coverFromAsset);

  return {
    ...item,
    coverAsset: item.coverAsset ?? null,
    coverImageUrl,
  };
}

function normalizeAdminNewsItem(raw: unknown): AdminNewsItem {
  const item = (raw ?? {}) as AdminNewsItem;
  const coverFromAsset = item.coverAsset?.thumbUrl ?? item.coverAsset?.url ?? null;
  const coverImageUrl = absUrl(item.coverImageUrl ?? coverFromAsset);

  return {
    ...item,
    coverAsset: item.coverAsset ?? null,
    coverImageUrl,
  };
}

function toApiError(e: unknown): ApiError {
  const err = (e ?? {}) as {
    response?: { status?: number; data?: unknown };
    config?: { url?: string };
    message?: string;
  };
  const status = err.response?.status;
  const url = err.config?.url;
  const details = err.response?.data;
  const detailsObj = details && typeof details === "object" ? (details as RecordLike) : null;
  const message =
    (typeof detailsObj?.message === "string" ? detailsObj.message : undefined) ||
    (typeof detailsObj?.mensagem === "string" ? detailsObj.mensagem : undefined) ||
    err.message ||
    "Falha ao buscar dados";

  return { message, status, url, details };
}

/* ======================================================
 * PUBLIC (LISTAGEM & VISUALIZAÇÃO)
 * ====================================================== */

/** Feed público (Home) */
export async function listPublicNews(
  opts?: { signal?: AbortSignal }
): Promise<PublicListResult> {
  try {
    const res = await api.get("/news/public", {
      signal: opts?.signal,
      params: { _ts: Date.now() },
    });

    const normalized = normalizeList<PublicNewsItem>(res.data);

    return {
      ...normalized,
      items: (normalized.items || []).map(normalizePublicNewsItem),
    };
  } catch (e) {
    throw toApiError(e);
  }
}

/** Categorias públicas */
export async function listPublicNewsCategories(
  opts?: { signal?: AbortSignal }
): Promise<NewsCategoryDTO[]> {
  try {
    const res = await api.get("/news/public/categories", {
      signal: opts?.signal,
      params: { _ts: Date.now() },
    });

    return normalizeList<NewsCategoryDTO>(res.data).items;
  } catch (e) {
    throw toApiError(e);
  }
}

/** ✅ Detalhe por slug (retorna o post COMPLETO) */
export async function getPublicNewsBySlug(
  slug: string,
  opts?: { signal?: AbortSignal }
): Promise<PublicNewsDetail> {
  if (!slug?.trim()) throw { message: "Slug obrigatório" } as ApiError;

  try {
    const res = await api.get(`/news/slug/${encodeURIComponent(slug)}`, {
      signal: opts?.signal,
      params: { _ts: Date.now() },
    });

    const post = (res.data?.data ?? {}) as PublicNewsDetail;

    // normaliza coverImageUrl pra manter compat
    const postWithCompat = post as PublicNewsDetail & { coverImageUrl?: string | null };
    const coverFromAsset = postWithCompat?.coverAsset?.url ?? postWithCompat?.coverAsset?.thumbUrl ?? null;
    const coverImageUrl = absUrl(postWithCompat?.coverImageUrl ?? coverFromAsset);

    return {
      ...post,
      coverAsset: post?.coverAsset ?? null,
      coverImageUrl,
    } as PublicNewsDetail;
  } catch (e) {
    throw toApiError(e);
  }
}

/** Arquivo público com filtros + paginação */
export async function listPublicNewsArchive(
  params?: PublicNewsArchiveParams,
  opts?: { signal?: AbortSignal }
): Promise<PublicListResult> {
  try {
    const page = Math.max(1, Number(params?.page ?? 1));
    const pageSize = Math.min(60, Math.max(6, Number(params?.pageSize ?? 12)));

    const res = await api.get("/news/public", {
      signal: opts?.signal,
      params: {
        page,
        pageSize,
        q: params?.q?.trim() || undefined,
        categoryId: params?.categoryId || undefined,
        date: params?.date?.trim() || undefined,
        dateFrom: params?.date ? undefined : params?.dateFrom,
        dateTo: params?.date ? undefined : params?.dateTo,
        sort: params?.sort ?? "newest",
        _ts: Date.now(),
      },
    });

    const normalized = normalizeList<PublicNewsItem>(res.data);

    return {
      ...normalized,
      items: (normalized.items || []).map(normalizePublicNewsItem),
    };
  } catch (e) {
    throw toApiError(e);
  }
}

/* ======================================================
 * ADMIN (LISTAGEM & AÇÕES BÁSICAS)
 * ====================================================== */

/** ADMIN: listagem paginada */
export async function listAdminNews(
  params?: AdminNewsListParams,
  opts?: { signal?: AbortSignal }
): Promise<AdminListResult> {
  try {
    const page = Math.max(1, Number(params?.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(5, Number(params?.pageSize ?? ADMIN_NEWS_PAGE_SIZE))
    );

    const res = await api.get("/news", {
      signal: opts?.signal,
      params: {
        page,
        pageSize,
        q: params?.q?.trim() || undefined,
        status: params?.status || undefined,
        categoryId: params?.categoryId || undefined,
        _ts: Date.now(),
      },
    });

    const normalized = normalizeList<AdminNewsItem>(res.data);

    return {
      ...normalized,
      items: (normalized.items || []).map(normalizeAdminNewsItem),
    };
  } catch (e) {
    throw toApiError(e);
  }
}

/** ADMIN: atualizar status */
export async function updateAdminNewsStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "HIDDEN",
  opts?: { signal?: AbortSignal }
) {
  try {
    await api.patch(
      `/news/${encodeURIComponent(id)}/status`,
      { status },
      { signal: opts?.signal }
    );
  } catch (e) {
    throw toApiError(e);
  }
}

/** ADMIN: excluir notícia */
export async function deleteAdminNews(
  id: string,
  opts?: { signal?: AbortSignal }
) {
  try {
    await api.delete(`/news/${encodeURIComponent(id)}`, {
      signal: opts?.signal,
    });
  } catch (e) {
    throw toApiError(e);
  }
}

/* ======================================================
 * EDITOR API (Usado pelo useNewsEditor / useNewsMedia)
 * ====================================================== */

export const newsApi = {
  // Busca categorias (Autenticado - pode retornar mais dados que a pública)
  async fetchCategories(signal?: AbortSignal) {
    const res = await api.get("/news/categories", {
      signal,
      headers: { Accept: "application/json" },
      timeout: REQUEST_TIMEOUT,
    });
    return Array.isArray(res.data?.items) ? (res.data.items as NewsCategoryDTO[]) : [];
  },

  // Deleta mídia temporária (cleanup)
  async deleteTmp(tmpId: string) {
    return api.delete(`/news-media/tmp/${tmpId}`, { timeout: REQUEST_TIMEOUT });
  },

  // Upload de capa (retorna ID temporário)
  async uploadCoverTmp(file: File): Promise<string> {
    // Validação client-side extra pra garantir UX rápida
    const { w, h } = await getImageSize(file);
    if (w < 1280 || h < 720) {
      throw new Error(`Imagem muito pequena (${w}x${h}). Mínimo: 1280x720 (16:9).`);
    }

    const fd = new FormData();
    fd.append("cover", file);

    const res = await api.post("/news-media/tmp/cover", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: REQUEST_TIMEOUT,
    });

    const tmpId = res.data?.id ?? res.data?.data?.id ?? res.data?.tmpId;
    if (!tmpId) throw new Error("ID temporário ausente na resposta.");
    return String(tmpId);
  },

  // Upload de galeria em lote
  async uploadGalleryTmp(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const fd = new FormData();
    for (const f of files) fd.append("images", f);

    const res = await api.post("/news-media/tmp/gallery", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: REQUEST_TIMEOUT,
    });

    const data = res.data as
      | { items?: Array<{ tmpId?: string }>; data?: { items?: Array<{ tmpId?: string }> } }
      | Array<{ tmpId?: string }>;
    const items = Array.isArray(data)
      ? data
      : data.items ?? data.data?.items ?? null;
    const ids = Array.isArray(items) ? items.map((x) => x?.tmpId).filter(Boolean) : null;

    if (!ids || ids.length === 0) throw new Error("Upload da galeria não retornou tmpIds.");
    return ids.map(String);
  },

  // Criação da notícia final (Commit)
  async createNews(payload: {
    title: string;
    contentHtml: string;
    excerpt?: string;
    categoryId?: string | null;
    status: PostStatus;
    isFeatured: boolean;
    showFeaturedImage: boolean;
    enableGallery: boolean;
    enableLinks: boolean;
    links: NewsLinkDTO[];
    coverTmpId?: string | null;
    galleryTmpIds?: string[];
  }) {
    return api.post("/news", payload, { timeout: REQUEST_TIMEOUT });
  },
};