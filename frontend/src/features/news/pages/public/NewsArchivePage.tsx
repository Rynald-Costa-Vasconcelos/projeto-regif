// src/features/news/pages/public/NewsArchivePage.tsx
import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";

import { useNewsArchive } from "../../hooks/useNewsArchive";
import { NewsHeader } from "../../components/public/NewsHeader";
import { NewsActiveChips } from "../../components/public/NewsActiveChips";
import { NewsFilters } from "../../components/public/NewsFilters";
import { NewsGrid } from "../../components/public/NewsGrid";
import { NewsPagination } from "../../components/public/NewsPagination";

export default function NewsArchivePage() {
  const {
    // ui
    filtersOpenMobile,
    setFiltersOpenMobile,

    // state
    draft,
    setDraft,
    setPage,
    items,
    meta,
    categories,
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
  } = useNewsArchive();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* voltar */}
      <div className="mb-4">
        <Link
          to="/"
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Home
        </Link>
      </div>

      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <NewsHeader />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpenMobile((v) => !v)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm",
              "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
              "sm:hidden"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* chips */}
      <NewsActiveChips chips={activeChips} />

      {/* filtros */}
      <div
        className={clsx(
          "mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
          "sm:block",
          filtersOpenMobile ? "block" : "hidden sm:block"
        )}
      >
        <NewsFilters
          draft={draft}
          setDraft={setDraft}
          categories={categories}
          loadingCats={loadingCats}
          onApply={applyFilters}
          onQuickLast30Days={setLast30DaysDraft}
          onQuickAnyDate={() =>
            setDraft((d) => ({
              ...d,
              date: "",
              dateFrom: "",
              dateTo: "",
            }))
          }
        />
      </div>

      {/* resultados */}
      <div className="mt-6">
        <NewsGrid
          items={items}
          rangeText={rangeText}
          loading={loading}
          error={error}
        />

        <NewsPagination
          page={meta.page}
          totalPages={meta.totalPages}
          loading={loading}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
        />
      </div>
    </div>
  );
}
