import clsx from "clsx";
import { Calendar, Filter, Search } from "lucide-react";

import type { DocumentCategoryDTO } from "../../../services/documentService";
import type { Filters, SortOrder } from "../types";

type DocumentsFiltersProps = {
  draft: Filters;
  setDraft: React.Dispatch<React.SetStateAction<Filters>>;

  categories: DocumentCategoryDTO[];
  loadingCats: boolean;

  // UI (mobile)
  isOpenMobile: boolean;

  onApply: () => void;
  onLast30Days: () => void;

  // opcional: botão "Qualquer data" (mantém UX igual)
  onClearDates?: () => void;
};

export function DocumentsFilters({
  draft,
  setDraft,
  categories,
  loadingCats,
  isOpenMobile,
  onApply,
  onLast30Days,
  onClearDates,
}: DocumentsFiltersProps) {
  return (
    <div
      id="documents-filters"
      className={clsx(
        "mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        "sm:block",
        isOpenMobile ? "block" : "hidden sm:block"
      )}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* busca */}
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Buscar por título
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") onApply();
              }}
              placeholder="Ex.: edital, ata, resolução..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* categoria */}
        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Categoria
          </label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={draft.categoryId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, categoryId: e.target.value }))
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {loadingCats && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                carregando…
              </span>
            )}
          </div>
        </div>

        {/* DIA */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Dia
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={draft.date}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  date: e.target.value,
                  dateFrom: "",
                  dateTo: "",
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* período */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            De
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={draft.dateFrom}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dateFrom: e.target.value,
                  date: "",
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Até
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={draft.dateTo}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dateTo: e.target.value,
                  date: "",
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* chips rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLast30Days}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Últimos 30 dias
          </button>

          <button
            type="button"
            onClick={
              onClearDates ??
              (() =>
                setDraft((d) => ({
                  ...d,
                  date: "",
                  dateFrom: "",
                  dateTo: "",
                })))
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Qualquer data
          </button>
        </div>

        {/* ordenação + pageSize + aplicar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Ordenar:</span>
            <select
              value={draft.sort}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sort: e.target.value as SortOrder,
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Por página:</span>
            <select
              value={draft.pageSize}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pageSize: Number(e.target.value) }))
              }
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onApply}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black shadow-sm",
              "bg-regif-blue text-white hover:opacity-95"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
        </div>
      </div>
    </div>
  );
}
