// src/features/news/components/public/NewsGrid.tsx
import { Loader2 } from "lucide-react";
import type { PublicNewsItem } from "../../types";
import { NewsCard } from "./NewsCard";

export function NewsGrid({
  items,
  rangeText,
  loading,
  error,
}: {
  items: PublicNewsItem[];
  rangeText: string;
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">{rangeText}</div>

        {loading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          Nenhuma notícia encontrada com esses filtros.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((post) => (
          <NewsCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
