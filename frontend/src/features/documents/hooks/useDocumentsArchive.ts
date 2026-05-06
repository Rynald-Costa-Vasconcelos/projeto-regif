import { useEffect, useMemo, useRef, useState } from "react";
import type { Filters, PaginationMeta } from "../types";
import type {
  DocumentCategoryDTO,
  PublicDocumentItem,
} from "../../../services/documentService";
import {
  listPublicDocumentCategories,
  listPublicDocuments,
} from "../../../services/documentService";
import { normalizeMeta, safeClampPage, toISODateOnly } from "../utils";

const DEFAULT_PAGE_SIZE = 12;

export function useDocumentsArchive() {
  const DEFAULT_FILTERS: Filters = useMemo(
    () => ({
      q: "",
      categoryId: "",
      date: "",
      dateFrom: "",
      dateTo: "",
      sort: "newest",
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    []
  );

  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);
  const [items, setItems] = useState<PublicDocumentItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        applied.q.trim() ||
          applied.categoryId ||
          applied.date ||
          applied.dateFrom ||
          applied.dateTo ||
          applied.sort !== "newest" ||
          applied.pageSize !== DEFAULT_PAGE_SIZE
      ),
    [applied]
  );

  function bumpDownloadsLocal(id: string) {
    setItems((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, downloads: (d.downloads ?? 0) + 1 } : d
      )
    );
  }

  async function fetchArchive() {
    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const effectiveDateFrom = applied.date || applied.dateFrom;
      const effectiveDateTo = applied.date || applied.dateTo;

      const res = await listPublicDocuments(
        {
          page,
          pageSize: applied.pageSize,
          q: applied.q.trim() || undefined,
          categoryId: applied.categoryId || undefined,
          date: applied.date || undefined,
          dateFrom: effectiveDateFrom || undefined,
          dateTo: effectiveDateTo || undefined,
          sort: applied.sort,
        },
        { signal: abortRef.current.signal }
      );

      const newItems = res.items || [];
      setItems(newItems);

      const normalized = normalizeMeta(
        res.meta,
        page,
        applied.pageSize,
        newItems.length
      );
      setMeta(normalized);

      const corrected = safeClampPage(page, normalized.totalPages);
      if (corrected !== page) setPage(corrected);
    } catch {
      setError("Não foi possível carregar o arquivo de documentos.");
      setItems([]);
      setMeta({
        page: 1,
        pageSize: applied.pageSize,
        total: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setPage(1);
  }

  function setLast30DaysDraft() {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - 30);

    setDraft((d) => ({
      ...d,
      date: "",
      dateFrom: toISODateOnly(from),
      dateTo: toISODateOnly(now),
    }));
  }

  // --------------------------------------------
  // ✅ Helpers pros chips (mantém draft + applied sync)
  // --------------------------------------------
  function patchApplied(patch: Partial<Filters>) {
    setDraft((d) => ({ ...d, ...patch }));
    setApplied((a) => ({ ...a, ...patch }));
    setPage(1);
  }

  const clearSearch = () => patchApplied({ q: "" });

  const clearCategory = () => patchApplied({ categoryId: "" });

  const clearDate = () => patchApplied({ date: "" });

  const clearRange = () => patchApplied({ dateFrom: "", dateTo: "" });

  const setSortNewest = () => patchApplied({ sort: "newest" });

  const setPageSizeDefault = () => patchApplied({ pageSize: DEFAULT_PAGE_SIZE });

  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const cats = await listPublicDocumentCategories();
        setCategories(cats);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, page]);

  return {
    draft,
    setDraft,
    applied,
    page,
    setPage,
    categories,
    items,
    meta,
    loading,
    loadingCats,
    error,
    hasActiveFilters,
    bumpDownloadsLocal,
    applyFilters,
    clearFilters,
    setLast30DaysDraft,
    fetchArchive,

    // ✅ expostos pro DocumentsActiveChips
    clearSearch,
    clearCategory,
    clearDate,
    clearRange,
    setSortNewest,
    setPageSizeDefault,
  };
}
