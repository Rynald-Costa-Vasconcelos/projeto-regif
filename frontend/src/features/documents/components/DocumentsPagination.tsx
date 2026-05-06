// src/features/documents/components/DocumentsPagination.tsx
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ArchiveLike = {
  meta: PaginationMeta;
  loading: boolean;
  setPage: (updater: (prev: number) => number) => void;
};

export function DocumentsPagination({ archive }: { archive: ArchiveLike }) {
  const { meta, loading, setPage } = archive;

  return (
    <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="text-sm text-slate-600">
        Página{" "}
        <span className="font-black text-slate-900">{meta.page}</span> de{" "}
        <span className="font-black text-slate-900">{meta.totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={meta.page <= 1 || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            meta.page <= 1 || loading
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          disabled={meta.page >= meta.totalPages || loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            meta.page >= meta.totalPages || loading
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
