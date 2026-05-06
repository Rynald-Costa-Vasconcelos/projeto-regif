// src/features/news/hooks/useAdminNewsList.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiError, AdminNewsItem, PaginationMeta } from "../types";
import { ADMIN_NEWS_PAGE_SIZE } from "../types";
import { deleteAdminNews, listAdminNews, updateAdminNewsStatus } from "../api/news.api";

function rangeText(meta: PaginationMeta) {
  const total = meta.total ?? 0;
  if (!total) return "0 resultados";
  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, total);
  return `${start}-${end} de ${total}`;
}

export function useAdminNewsList() {
  const [items, setItems] = useState<AdminNewsItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: ADMIN_NEWS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const abortRef = useRef<AbortController | null>(null);

  async function fetchNews(opts?: { resetPage?: boolean }) {
    const resetPage = opts?.resetPage ?? false;
    const nextPage = resetPage ? 1 : page;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await listAdminNews(
        {
          page: nextPage,
          pageSize: ADMIN_NEWS_PAGE_SIZE,
          q: searchTerm.trim() || undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      const nextItems = res.items ?? [];
      const nextMeta: PaginationMeta = res.meta
        ? {
            page: Number(res.meta.page ?? nextPage),
            pageSize: Number(res.meta.pageSize ?? ADMIN_NEWS_PAGE_SIZE),
            total: Number(res.meta.total ?? nextItems.length),
            totalPages: Number(res.meta.totalPages ?? 1),
          }
        : {
            page: nextPage,
            pageSize: ADMIN_NEWS_PAGE_SIZE,
            total: nextItems.length,
            totalPages: Math.max(1, Math.ceil(nextItems.length / ADMIN_NEWS_PAGE_SIZE)),
          };

      setItems(nextItems);
      setMeta(nextMeta);

      if (resetPage) setPage(1);
      else if (nextPage > nextMeta.totalPages) setPage(nextMeta.totalPages);
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== "CanceledError" && !controller.signal.aborted) {
        setError(e as ApiError);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews({ resetPage: true });
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function toggleVisibility(id: string, status: AdminNewsItem["status"]) {
    try {
      const newStatus = status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
      await updateAdminNewsStatus(id, newStatus);
      fetchNews();
    } catch {
      alert("Não foi possível alterar a visibilidade.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Deseja apagar esta notícia permanentemente?")) return;

    try {
      await deleteAdminNews(id);

      // corrige paginação se a página ficar vazia
      const isLastItemOnPage = items.length === 1 && page > 1;
      if (isLastItemOnPage) setPage((p) => Math.max(1, p - 1));
      else fetchNews();
    } catch {
      alert("Erro ao excluir a notícia.");
    }
  }

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  const resultsText = useMemo(() => rangeText(meta), [meta]);

  return {
    // state
    items,
    meta,
    loading,
    error,
    searchTerm,
    page,

    // derived
    canPrev,
    canNext,
    resultsText,

    // actions
    setSearchTerm,
    setPage,
    fetchNews,
    toggleVisibility,
    deleteNews: remove,
  };
}
