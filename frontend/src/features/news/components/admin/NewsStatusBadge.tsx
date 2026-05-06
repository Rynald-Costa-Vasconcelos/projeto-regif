// src/features/news/components/admin/NewsStatusBadge.tsx
import clsx from "clsx";

export function NewsStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: "Publicado", cls: "bg-green-100 text-green-700" },
    DRAFT: { label: "Rascunho", cls: "bg-amber-100 text-amber-700" },
    HIDDEN: { label: "Oculto", cls: "bg-gray-100 text-gray-700" },
  };

  const item = map[status] ?? map.DRAFT;

  return (
    <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", item.cls)}>
      {item.label}
    </span>
  );
}
