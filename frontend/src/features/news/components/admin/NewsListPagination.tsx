// src/features/news/components/admin/NewsListPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type Props = {
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function NewsListPagination({
  page,
  totalPages,
  canPrev,
  canNext,
  loading,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="text-sm text-gray-600">
        Página <span className="font-black text-gray-900">{page}</span> de{" "}
        <span className="font-black text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            !canPrev || loading
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            !canNext || loading
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          )}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
