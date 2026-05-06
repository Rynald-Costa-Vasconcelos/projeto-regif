// src/features/news/components/admin/NewsListTable.tsx
import { BarChart3, Edit3, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { AdminNewsItem } from "../../types";
import { NewsStatusBadge } from "./NewsStatusBadge";

type Props = {
  items: AdminNewsItem[];
  onToggleVisibility: (id: string, status: AdminNewsItem["status"]) => void;
  onDelete: (id: string) => void;
};

export function NewsListTable({ items, onToggleVisibility, onDelete }: Props) {
  return (
    <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-6 py-4 text-left">Notícia</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-center">Acessos</th>
            <th className="px-6 py-4">Autor/Data</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-6 py-4 align-middle">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-gray-900 truncate">{item.title}</span>
                  <span className="text-[10px] text-regif-blue font-bold uppercase mt-1 truncate">
                    {item.category?.name || "Sem Categoria"}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 align-middle">
                <div className="grid place-items-center">
                  <NewsStatusBadge status={item.status} />
                </div>
              </td>

              <td className="px-6 py-4 align-middle text-center text-gray-600">
                <div className="inline-flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-gray-400" />
                  <span className="font-semibold">{item.views}</span>
                </div>
              </td>

              <td className="px-6 py-4 align-middle text-center text-xs">
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-800 font-medium">{item.author.name}</span>
                  <span className="text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 align-middle">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/admin/news/${item.id}`}
                    title="Abrir preview (visitante)"
                    className="p-2 rounded-lg hover:bg-blue-50 transition"
                  >
                    <ExternalLink size={18} className="text-regif-blue" />
                  </Link>

                  <button
                    onClick={() => onToggleVisibility(item.id, item.status)}
                    className={clsx(
                      "p-2 rounded-lg transition",
                      item.status === "PUBLISHED"
                        ? "text-amber-600 hover:bg-amber-50"
                        : "text-regif-blue hover:bg-blue-50"
                    )}
                    title={item.status === "PUBLISHED" ? "Ocultar" : "Publicar"}
                  >
                    {item.status === "PUBLISHED" ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <Link
                    to={`/admin/news/${item.id}/edit`}
                    title="Editar"
                    className="p-2 rounded-lg hover:bg-green-50 transition"
                  >
                    <Edit3 size={18} className="text-regif-green" />
                  </Link>

                  <button
                    onClick={() => onDelete(item.id)}
                    title="Excluir"
                    className="p-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={18} className="text-regif-red" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
