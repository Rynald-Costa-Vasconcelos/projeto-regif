// src/features/news/components/admin/NewsListToolbar.tsx
import { RefreshCcw, Search } from "lucide-react";

type Props = {
  searchTerm: string;
  onChangeSearch: (v: string) => void;
  onSearch: () => void;
};

export function NewsListToolbar({ searchTerm, onChangeSearch, onSearch }: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Pesquisar por título ou trecho..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
          value={searchTerm}
          onChange={(e) => onChangeSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-regif-blue hover:bg-blue-50 rounded-xl transition"
          title="Pesquisar/Atualizar"
        >
          <RefreshCcw size={18} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
