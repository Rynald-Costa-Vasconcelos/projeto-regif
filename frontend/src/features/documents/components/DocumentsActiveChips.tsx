// src/features/documents/components/DocumentsActiveChips.tsx
import { X } from "lucide-react";

import type { DocumentCategoryDTO } from "../../../services/documentService";
import { formatDateBR } from "../utils";
import type { Filters } from "../types";

/**
 * A ideia aqui: o hook/page passa o "archive" (igual você já está usando),
 * e esse componente só monta os chips e executa as ações.
 */

type ArchiveLike = {
  applied: Filters;
  categories: DocumentCategoryDTO[];
  setDraft: React.Dispatch<React.SetStateAction<Filters>>;
  applyFilters: () => void; // (não vamos usar aqui, mas deixo se você quiser evoluir)
  setPage: React.Dispatch<React.SetStateAction<number>>;

  // para remover filtros sem depender de funções internas do hook:
  // (essas duas linhas existem no seu hook atual)
  // - no hook você já tem "draft" e "setDraft"
  // - e controla "applied" internamente
  // ✅ então: precisamos de um "setApplied" OU helpers de remoção.
  //
  // Como seu hook não expõe setApplied (por design), vamos fazer do jeito limpo:
  // expor um método no hook: `removeAppliedFilter(partial: Partial<Filters>)`
  //
  // MAS você pediu "um por um" e sem mexer em muita coisa:
  // então vamos assumir que você expôs esses métodos no hook:
  clearSearch: () => void;
  clearCategory: () => void;
  clearDate: () => void;
  clearRange: () => void;
  setSortNewest: () => void;
  setPageSizeDefault: () => void;
};

type DocumentsActiveChipsProps = {
  archive: ArchiveLike;
};

export function DocumentsActiveChips({ archive }: DocumentsActiveChipsProps) {
  const { applied, categories } = archive;

  const chips: { label: string; onRemove?: () => void }[] = [];

  if (applied.q.trim()) {
    chips.push({
      label: `Busca: "${applied.q.trim()}"`,
      onRemove: () => archive.clearSearch(),
    });
  }

  if (applied.categoryId) {
    const cat = categories.find((c) => c.id === applied.categoryId);
    chips.push({
      label: cat ? `Categoria: ${cat.name}` : "Categoria: (selecionada)",
      onRemove: () => archive.clearCategory(),
    });
  }

  if (applied.date) {
    chips.push({
      label: `Dia: ${formatDateBR(applied.date)}`,
      onRemove: () => archive.clearDate(),
    });
  } else if (applied.dateFrom || applied.dateTo) {
    const from = applied.dateFrom ? formatDateBR(applied.dateFrom) : "—";
    const to = applied.dateTo ? formatDateBR(applied.dateTo) : "—";
    chips.push({
      label: `Período: ${from} → ${to}`,
      onRemove: () => archive.clearRange(),
    });
  }

  if (applied.sort !== "newest") {
    chips.push({
      label: "Ordenação: mais antigos",
      onRemove: () => archive.setSortNewest(),
    });
  }

  if (applied.pageSize !== 12) {
    chips.push({
      label: `Por página: ${applied.pageSize}`,
      onRemove: () => archive.setPageSizeDefault(),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip, idx) => (
        <button
          key={`${chip.label}-${idx}`}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          title="Remover filtro"
        >
          {chip.label}
          <X className="h-3.5 w-3.5 text-slate-400" />
        </button>
      ))}
    </div>
  );
}
