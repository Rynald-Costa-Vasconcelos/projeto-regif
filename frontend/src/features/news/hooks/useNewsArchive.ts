// src/features/news/hooks/useNewsArchive.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicNewsItem } from "../types";
import { listPublicNewsArchive, listPublicNewsCategories } from "../api/news.api";

export type NewsCategoryDTO = {
  id: string;
  name: string;
  slug?: string;
  color?: string | null;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SortOrder = "newest" | "oldest";

export type Filters = {
  q: string;
  categoryId: string;

  date: string; // YYYY-MM-DD (dia específico)
  dateFrom: string;
  dateTo: string;

  sort: SortOrder;
  pageSize: number;
};

function toISODateOnly(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateBR(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeMeta(
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
    const totalPages = Number(m.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    return { page, pageSize, total, totalPages };
  }
  return { page: fallbackPage, pageSize: fallbackPageSize, total: itemsLen, totalPages: 1 };
}

function safeClampPage(p: number, totalPages: number) {
  return Math.min(Math.max(1, p), Math.max(1, totalPages));
}

export function useNewsArchive() {
  const DEFAULT_FILTERS: Filters = useMemo(
    () => ({
      q: "",
      categoryId: "",
      date: "",
      dateFrom: "",
      dateTo: "",
      sort: "newest",
      pageSize: 12,
    }),
    []
  );

  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<NewsCategoryDTO[]>([]);
  const [items, setItems] = useState<PublicNewsItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_FILTERS.pageSize,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  /** Evita aplicar erro/lista de um fetch antigo quando outro já substituiu (abort, Strict Mode, navegação). */
  const fetchGenerationRef = useRef(0);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      applied.q.trim() ||
        applied.categoryId ||
        applied.date ||
        applied.dateFrom ||
        applied.dateTo ||
        applied.sort !== "newest" ||
        applied.pageSize !== 12
    );
  }, [applied]);

  // categorias (prioriza rota pública do service; se você quiser manter fallback admin, mantemos)
  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      try {
        const cats = await listPublicNewsCategories();
        setCategories(Array.isArray(cats) ? (cats as NewsCategoryDTO[]) : []);
      } catch {
        setCategories([]);
      }
    })().finally(() => setLoadingCats(false));
  }, []);

  async function fetchArchive() {
    const gen = ++fetchGenerationRef.current;

    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const effectiveDateFrom = applied.date ? applied.date : applied.dateFrom;
      const effectiveDateTo = applied.date ? applied.date : applied.dateTo;

      const res = await listPublicNewsArchive(
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
        { signal: controller.signal }
      );

      if (fetchGenerationRef.current !== gen) return;

      const newItems = res.items || [];
      setItems(newItems);

      const normalized = normalizeMeta(res.meta, page, applied.pageSize, newItems.length);
      setMeta(normalized);

      const corrected = safeClampPage(page, normalized.totalPages);
      if (corrected !== page) setPage(corrected);
    } catch {
      if (fetchGenerationRef.current !== gen) return;

      setError("Não foi possível carregar o arquivo de notícias.");
      setItems([]);
      setMeta({ page: 1, pageSize: applied.pageSize, total: 0, totalPages: 1 });
    } finally {
      if (fetchGenerationRef.current === gen) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchArchive();
    return () => {
      fetchGenerationRef.current += 1;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, page]);

  function applyFilters() {
    setApplied(draft);
    setPage(1);
    setFiltersOpenMobile(false);
  }

  function clearFilters() {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setPage(1);
    setFiltersOpenMobile(false);
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

  const rangeText = useMemo(() => {
    const total = meta.total ?? 0;
    if (!total) return "0 resultados";
    const start = (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.page * meta.pageSize, total);
    return `${start}-${end} de ${total}`;
  }, [meta]);

  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove?: () => void }[] = [];

    if (applied.q.trim()) {
      chips.push({
        label: `Busca: "${applied.q.trim()}"`,
        onRemove: () => {
          setDraft((d) => ({ ...d, q: "" }));
          setApplied((a) => ({ ...a, q: "" }));
          setPage(1);
        },
      });
    }

    if (applied.categoryId) {
      const cat = categories.find((c) => c.id === applied.categoryId);
      chips.push({
        label: cat ? `Categoria: ${cat.name}` : "Categoria: (selecionada)",
        onRemove: () => {
          setDraft((d) => ({ ...d, categoryId: "" }));
          setApplied((a) => ({ ...a, categoryId: "" }));
          setPage(1);
        },
      });
    }

    if (applied.date) {
      chips.push({
        label: `Dia: ${formatDateBR(applied.date)}`,
        onRemove: () => {
          setDraft((d) => ({ ...d, date: "" }));
          setApplied((a) => ({ ...a, date: "" }));
          setPage(1);
        },
      });
    } else if (applied.dateFrom || applied.dateTo) {
      const from = applied.dateFrom ? formatDateBR(applied.dateFrom) : "—";
      const to = applied.dateTo ? formatDateBR(applied.dateTo) : "—";
      chips.push({
        label: `Período: ${from} → ${to}`,
        onRemove: () => {
          setDraft((d) => ({ ...d, dateFrom: "", dateTo: "" }));
          setApplied((a) => ({ ...a, dateFrom: "", dateTo: "" }));
          setPage(1);
        },
      });
    }

    if (applied.sort !== "newest") {
      chips.push({
        label: "Ordenação: mais antigas",
        onRemove: () => {
          setDraft((d) => ({ ...d, sort: "newest" }));
          setApplied((a) => ({ ...a, sort: "newest" }));
          setPage(1);
        },
      });
    }

    if (applied.pageSize !== 12) {
      chips.push({
        label: `Por página: ${applied.pageSize}`,
        onRemove: () => {
          setDraft((d) => ({ ...d, pageSize: 12 }));
          setApplied((a) => ({ ...a, pageSize: 12 }));
          setPage(1);
        },
      });
    }

    return chips;
  }, [applied, categories]);

  return {
    // ui
    filtersOpenMobile,
    setFiltersOpenMobile,

    // state
    DEFAULT_FILTERS,
    draft,
    setDraft,
    applied,
    setApplied,
    page,
    setPage,
    categories,
    items,
    meta,
    loading,
    loadingCats,
    error,

    // derived
    hasActiveFilters,
    rangeText,
    activeChips,

    // actions
    applyFilters,
    clearFilters,
    setLast30DaysDraft,
  };
}
