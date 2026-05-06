// src/features/news/components/admin/NewsListCards.tsx
import { BarChart3, Calendar, Edit3, ExternalLink, Eye, EyeOff, Tag, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { AdminNewsItem } from "../../types";
import { NewsStatusBadge } from "./NewsStatusBadge";

type Props = {
  items: AdminNewsItem[];
  onToggleVisibility: (id: string, status: AdminNewsItem["status"]) => void;
  onDelete: (id: string) => void;
};

export function NewsListCards({ items, onToggleVisibility, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {items.map((item) => {
        const created = new Date(item.createdAt).toLocaleDateString("pt-BR");
        const category = item.category?.name || "Sem Categoria";

        return (
          <div key={item.id} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 leading-snug line-clamp-2">{item.title}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={14} className="text-gray-400" />
                    <span className="font-semibold text-regif-blue">{category}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    <span>{item.author.name}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{created}</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <NewsStatusBadge status={item.status} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-xl px-2.5 py-1">
                  <BarChart3 size={14} className="text-gray-400" />
                  <span className="font-semibold">{item.views}</span>
                  <span className="text-gray-400">acessos</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/news/${item.id}`}
                  title="Abrir preview (visitante)"
                  className="p-2 rounded-xl border bg-white hover:bg-blue-50 transition"
                >
                  <ExternalLink size={18} className="text-regif-blue" />
                </Link>

                <button
                  onClick={() => onToggleVisibility(item.id, item.status)}
                  title={item.status === "PUBLISHED" ? "Ocultar" : "Publicar"}
                  className={clsx(
                    "p-2 rounded-xl border bg-white transition",
                    item.status === "PUBLISHED" ? "hover:bg-amber-50" : "hover:bg-blue-50"
                  )}
                >
                  {item.status === "PUBLISHED" ? (
                    <EyeOff size={18} className="text-amber-600" />
                  ) : (
                    <Eye size={18} className="text-regif-blue" />
                  )}
                </button>

                <Link
                  to={`/admin/news/${item.id}/edit`}
                  title="Editar"
                  className="p-2 rounded-xl border bg-white hover:bg-green-50 transition"
                >
                  <Edit3 size={18} className="text-regif-green" />
                </Link>

                <button
                  onClick={() => onDelete(item.id)}
                  title="Excluir"
                  className="p-2 rounded-xl border bg-white hover:bg-red-50 transition"
                >
                  <Trash2 size={18} className="text-regif-red" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
