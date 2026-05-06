import clsx from "clsx";
import { SlidersHorizontal, X } from "lucide-react";

type DocumentsHeaderProps = {
  hasActiveFilters: boolean;
  onClearFilters: () => void;

  // ✅ opcional: a page pode controlar isso (se você quiser manter igual ao antigo)
  filtersOpenMobile?: boolean;
  onToggleFiltersMobile?: () => void;
};

export function DocumentsHeader({
  hasActiveFilters,
  onClearFilters,
  filtersOpenMobile,
  onToggleFiltersMobile,
}: DocumentsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-black tracking-[0.18em] text-slate-500">
          ARQUIVO
        </div>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Arquivo completo de documentos
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Pesquise por título, filtre por categoria e data, e baixe/abra os
          arquivos com 1 clique.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Botão filtros (mobile) */}
        <button
          type="button"
          onClick={onToggleFiltersMobile}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm",
            "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
            "sm:hidden"
          )}
          aria-expanded={filtersOpenMobile}
          aria-controls="documents-filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
