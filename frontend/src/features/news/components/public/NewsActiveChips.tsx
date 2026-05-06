// src/features/news/components/public/NewsActiveChips.tsx
import { X } from "lucide-react";

export function NewsActiveChips({
  chips,
}: {
  chips: { label: string; onRemove?: () => void }[];
}) {
  if (!chips?.length) return null;

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
