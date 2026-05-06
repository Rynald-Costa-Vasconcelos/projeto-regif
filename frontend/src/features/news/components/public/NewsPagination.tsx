// src/features/news/components/public/NewsPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export function NewsPagination({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="text-sm text-slate-600">
        Página <span className="font-black text-slate-900">{page}</span> de{" "}
        <span className="font-black text-slate-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1 || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            page <= 1 || loading
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
          disabled={page >= totalPages || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            page >= totalPages || loading
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
