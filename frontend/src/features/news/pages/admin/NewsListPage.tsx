// src/features/news/pages/admin/NewsListPage.tsx
import { Link } from "react-router-dom";
import {
  Loader2,
  Newspaper,
  Plus,
  ServerCrash,
} from "lucide-react";

import { useAdminNewsList } from "../../hooks/useAdminNewsList";
import { NewsListToolbar } from "../../components/admin/NewsListToolbar";
import { NewsListCards } from "../../components/admin/NewsListCards";
import { NewsListTable } from "../../components/admin/NewsListTable";
import { NewsListPagination } from "../../components/admin/NewsListPagination";

export function NewsListPage() {
  const {
    items,
    meta,
    loading,
    error,
    searchTerm,
    canPrev,
    canNext,
    resultsText,
    setSearchTerm,
    setPage,
    fetchNews,
    toggleVisibility,
    deleteNews,
  } = useAdminNewsList();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="text-regif-blue" /> Gerenciar Notícias
          </h1>
          <p className="text-gray-500 text-sm">Gerencie publicações do portal.</p>
        </div>

        <Link
          to="/admin/news/new"
          className="inline-flex items-center justify-center gap-2 bg-regif-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow active:scale-[0.99] transition"
        >
          <Plus size={20} /> Nova Notícia
        </Link>
      </div>

      {/* BUSCA */}
      <NewsListToolbar
        searchTerm={searchTerm}
        onChangeSearch={setSearchTerm}
        onSearch={() => fetchNews({ resetPage: true })}
      />

      {/* RESULTADOS HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">{resultsText}</div>

        {loading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-regif-blue" />
            Carregando…
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border">
          <Loader2 className="animate-spin text-regif-blue" size={40} />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl border text-red-700">
          <div className="flex items-start gap-3">
            <ServerCrash className="mt-0.5" />
            <div>
              <p className="font-bold">Falha na requisição</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>

          <button
            onClick={() => fetchNews({ resetPage: true })}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">
          Nenhuma notícia encontrada.
        </div>
      ) : (
        <>
          <NewsListCards
            items={items}
            onToggleVisibility={toggleVisibility}
            onDelete={deleteNews}
          />

          <NewsListTable
            items={items}
            onToggleVisibility={toggleVisibility}
            onDelete={deleteNews}
          />

          <NewsListPagination
            page={meta.page}
            totalPages={meta.totalPages}
            canPrev={canPrev}
            canNext={canNext}
            loading={loading}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          />
        </>
      )}
    </div>
  );
}
