// src/pages/admin/DocumentsList.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  ServerCrash,
  ExternalLink,
  Download,
  Edit3,
  Trash2,
  RefreshCcw,
  Tag,
  Calendar,
  User,
  Archive,
  ArchiveRestore,
  EyeOff,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

import type { AxiosError } from "axios";
import {
  listAdminDocuments,
  listAdminDocumentCategories,
  updateDocumentStatus,
  updateDocument,
  deleteDocument,
  type PublicDocumentItem,
} from "../../services/documentService";

import { EditDocumentModal } from "../../components/admin/EditDocumentModal";

type DocumentStatus = "PUBLISHED" | "HIDDEN" | "ARCHIVED";

type DocumentCategoryDTO = {
  id: string;
  name: string;
  slug?: string;
  sortOrder?: number;
};

type DocumentDTO = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;

  fileUrl: string;
  mimeType?: string | null;
  originalName?: string | null;
  sizeBytes?: number | null;

  status: DocumentStatus;
  downloads: number;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;

  category?: { id: string; name: string } | null;
  uploadedBy?: { id: string; name: string } | null;

  // (pode existir no retorno do backend; usamos no modal se vier)
  categoryId?: string | null;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
type ErrorPayload = { message?: string; mensagem?: string };

const PAGE_SIZE = 20;

function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<ErrorPayload>;
  const status = e.response?.status;

  let message = e.message || "Erro inesperado";
  const code = e.code;

  if (code === "ECONNABORTED") message = "Tempo limite excedido ao consultar a API.";
  if (status === 401) message = "Sessão expirada ou token ausente. Faça login novamente.";
  if (status === 403) message = "Você não tem permissão para acessar documentos.";
  if (status === 404) message = "Endpoint não encontrado.";

  return { message, code, status };
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function prettyDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function buildPublicFileUrl(fileUrl: string) {
  return normalizePath(fileUrl);
}

function rangeText(meta: PaginationMeta) {
  const total = meta.total ?? 0;
  if (!total) return "0 resultados";
  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, total);
  return `${start}-${end} de ${total}`;
}

export function DocumentsList() {
  const [docs, setDocs] = useState<DocumentDTO[]>([]);
  const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DocumentStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  // =========================
  // Modal de edição
  // =========================
  const [editOpen, setEditOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentDTO | null>(null);

  function openEditModal(d: DocumentDTO) {
    setEditDoc(d);
    setEditOpen(true);
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditDoc(null);
  }

  const abortRef = useRef<AbortController | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: searchTerm.trim() || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
    }),
    [page, searchTerm, statusFilter, categoryFilter]
  );

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  async function fetchAll() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const [docsRes, catsRes] = await Promise.all([
        listAdminDocuments(queryParams, { signal: controller.signal }),
        listAdminDocumentCategories({ signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      const items = docsRes.items ?? [];
      const m = docsRes.meta;

      setDocs(Array.isArray(items) ? items : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);

      if (m && typeof m === "object") {
        setMeta({
          page: Number(m.page ?? page),
          pageSize: Number(m.pageSize ?? PAGE_SIZE),
          total: Number(m.total ?? 0),
          totalPages: Number(m.totalPages ?? 1),
        });
      } else {
        setMeta({
          page,
          pageSize: PAGE_SIZE,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        });
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "CanceledError" && !controller.signal.aborted) {
        setError(toApiError(err));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // ✅ melhora: atualiza o item localmente (sem refetch)
  async function changeStatus(id: string, status: DocumentStatus) {
    try {
      const updated = (await updateDocumentStatus(id, status)) as unknown as DocumentDTO;

      setDocs((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
      );

      // opcional: se quiser consistência total da paginação/contagem, use fetchAll()
      // fetchAll();
    } catch {
      alert("Não foi possível atualizar o status do documento.");
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Deseja apagar este documento permanentemente? O PDF será removido do servidor."
      )
    )
      return;

    try {
      await deleteDocument(id);

      // remove localmente pra não depender de refetch
      setDocs((prev) => prev.filter((d) => d.id !== id));

      // se era o último item da página e não é a primeira página, volta 1 página
      if (docs.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchAll();
    } catch {
      alert("Erro ao excluir o documento.");
    }
  }

  async function handleEditSubmit(
    id: string,
    patch: {
      title: string;
      description: string | null;
      status: DocumentStatus;
      categoryId: string | null;
    }
  ) {
    const updated = (await updateDocument(id, patch)) as unknown as DocumentDTO;

    setDocs((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));

    return updated;
  }

  const stats = useMemo(() => {
    const total = meta.total;
    const published = docs.filter((d) => d.status === "PUBLISHED").length;
    const hidden = docs.filter((d) => d.status === "HIDDEN").length;
    const archived = docs.filter((d) => d.status === "ARCHIVED").length;
    return { total, published, hidden, archived };
  }, [docs, meta.total]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, categoryFilter]);

  const headerBtn =
    "shrink-0 self-start whitespace-nowrap inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold shadow active:scale-[0.99] transition";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-regif-blue" /> Gerenciar Documentos
          </h1>
          <p className="text-gray-500 text-sm">
            Portal da Transparência — upload e gestão de PDFs, categorias e status.
          </p>

          {/* Mini métricas */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <StatPill label="Total" value={stats.total} />
            <StatPill
              label="Publicados (página)"
              value={stats.published}
              className="bg-green-50 border-green-200 text-green-700"
            />
            <StatPill
              label="Ocultos (página)"
              value={stats.hidden}
              className="bg-gray-50 border-gray-200 text-gray-700"
            />
            <StatPill
              label="Arquivados (página)"
              value={stats.archived}
              className="bg-amber-50 border-amber-200 text-amber-800"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/documents/new"
            className={clsx(headerBtn, "bg-regif-blue text-white hover:bg-blue-700")}
          >
            <Plus size={20} /> Novo Documento
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar por título, descrição ou responsável..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPage(1);
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:flex gap-3">
            <select
              className="px-3 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | DocumentStatus)}
              aria-label="Filtrar por status"
            >
              <option value="">Todos</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="HIDDEN">Oculto</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>

            <select
              className="px-3 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchAll()}
              className="col-span-2 md:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-regif-blue hover:bg-blue-50 rounded-xl transition"
              title="Atualizar"
            >
              <RefreshCcw size={18} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* RANGE + LOADING */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">{rangeText(meta)}</div>

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
            onClick={() => fetchAll()}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">
          Nenhum documento encontrado.
        </div>
      ) : (
        <>
          {/* MOBILE: CARDS */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {docs.map((d) => {
              const category = d.category?.name || "Sem categoria";
              const uploader = d.uploadedBy?.name || "—";
              const created = prettyDate(d.createdAt);
              const pdfUrl = buildPublicFileUrl(d.fileUrl);

              return (
                <div key={d.id} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 leading-snug line-clamp-2">
                        {d.title}
                      </p>

                      {d.description ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {d.description}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={14} className="text-gray-400" />
                          <span className="font-semibold text-regif-blue">{category}</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          <span>{uploader}</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{created}</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <DocStatusBadge status={d.status} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-xl px-2.5 py-1">
                      <Download size={14} className="text-gray-400" />
                      <span className="font-semibold">{d.downloads}</span>
                      <span className="text-gray-400">downloads</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-xl px-2.5 py-1">
                      <FileText size={14} className="text-gray-400" />
                      <span className="font-semibold">{formatBytes(d.sizeBytes)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-blue-50 transition font-bold text-regif-blue text-sm"
                      title="Abrir PDF"
                    >
                      <ExternalLink size={18} />
                      Abrir PDF
                    </a>

                    <div className="flex items-center gap-2">
                      {d.status !== "ARCHIVED" ? (
                        <button
                          onClick={() =>
                            changeStatus(d.id, d.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")
                          }
                          title={d.status === "PUBLISHED" ? "Ocultar" : "Publicar"}
                          className={clsx(
                            "p-2 rounded-xl border bg-white transition",
                            d.status === "PUBLISHED" ? "hover:bg-amber-50" : "hover:bg-blue-50"
                          )}
                        >
                          {d.status === "PUBLISHED" ? (
                            <EyeOff size={18} className="text-amber-600" />
                          ) : (
                            <Eye size={18} className="text-regif-blue" />
                          )}
                        </button>
                      ) : null}

                      {/* ARCHIVE <-> RESTORE */}
                      {d.status === "ARCHIVED" ? (
                        <button
                          onClick={() => changeStatus(d.id, "HIDDEN")}
                          title="Desarquivar (volta como Oculto)"
                          className="p-2 rounded-xl border bg-white hover:bg-blue-50 transition"
                        >
                          <ArchiveRestore size={18} className="text-regif-blue" />
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus(d.id, "ARCHIVED")}
                          title="Arquivar"
                          className="p-2 rounded-xl border bg-white hover:bg-amber-50 transition"
                        >
                          <Archive size={18} className="text-amber-700" />
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(d)}
                        title="Editar"
                        className="p-2 rounded-xl border bg-white hover:bg-green-50 transition"
                      >
                        <Edit3 size={18} className="text-regif-green" />
                      </button>

                      <button
                        onClick={() => handleDelete(d.id)}
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

          {/* DESKTOP: TABELA */}
          <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-4 text-left">Documento</th>
                  <th className="px-6 py-4 w-[140px]">Status</th>
                  <th className="px-6 py-4 w-[220px]">Categoria</th>
                  <th className="px-6 py-4 w-[170px]">Upload</th>
                  <th className="px-6 py-4 w-[190px] text-center">Arquivo</th>
                  <th className="px-6 py-4 w-[220px] text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {docs.map((d) => {
                  const pdfUrl = buildPublicFileUrl(d.fileUrl);

                  return (
                    <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 truncate" title={d.title}>
                            {d.title}
                          </span>

                          {d.description ? (
                            <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {d.description}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 mt-1">Sem descrição</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <div className="grid place-items-center">
                          <DocStatusBadge status={d.status} />
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <Tag size={14} className="text-gray-400" />
                          <span className="font-semibold text-regif-blue">
                            {d.category?.name || "—"}
                          </span>
                        </span>
                      </td>

                      <td className="px-6 py-4 align-middle text-center text-xs">
                        <div className="flex flex-col leading-tight">
                          <span className="text-gray-800 font-medium">
                            {d.uploadedBy?.name || "—"}
                          </span>
                          <span className="text-gray-400">{prettyDate(d.createdAt)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-xs text-gray-600">
                        <div className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Download size={14} className="text-gray-400" />
                            <span className="font-semibold">{d.downloads}</span>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <FileText size={14} className="text-gray-400" />
                            <span className="font-semibold">{formatBytes(d.sizeBytes)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir PDF"
                            className="p-2 rounded-lg hover:bg-blue-50 transition"
                          >
                            <ExternalLink size={18} className="text-regif-blue" />
                          </a>

                          {d.status !== "ARCHIVED" ? (
                            <button
                              onClick={() =>
                                changeStatus(d.id, d.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")
                              }
                              className={clsx(
                                "p-2 rounded-lg transition",
                                d.status === "PUBLISHED"
                                  ? "text-amber-600 hover:bg-amber-50"
                                  : "text-regif-blue hover:bg-blue-50"
                              )}
                              title={d.status === "PUBLISHED" ? "Ocultar" : "Publicar"}
                            >
                              {d.status === "PUBLISHED" ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          ) : null}

                          {/* ARCHIVE <-> RESTORE */}
                          {d.status === "ARCHIVED" ? (
                            <button
                              onClick={() => changeStatus(d.id, "HIDDEN")}
                              title="Desarquivar (volta como Oculto)"
                              className="p-2 rounded-lg hover:bg-blue-50 transition"
                            >
                              <ArchiveRestore size={18} className="text-regif-blue" />
                            </button>
                          ) : (
                            <button
                              onClick={() => changeStatus(d.id, "ARCHIVED")}
                              title="Arquivar"
                              className="p-2 rounded-lg hover:bg-amber-50 transition"
                            >
                              <Archive size={18} className="text-amber-700" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(d)}
                            title="Editar"
                            className="p-2 rounded-lg hover:bg-green-50 transition"
                          >
                            <Edit3 size={18} className="text-regif-green" />
                          </button>

                          <button
                            onClick={() => handleDelete(d.id)}
                            title="Excluir"
                            className="p-2 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={18} className="text-regif-red" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINAÇÃO */}
          <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-gray-600">
              Página <span className="font-black text-gray-900">{meta.page}</span> de{" "}
              <span className="font-black text-gray-900">{meta.totalPages}</span>
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
        </>
      )}

      {/* MODAL EDITAR */}
      <EditDocumentModal
        open={editOpen}
        onClose={closeEditModal}
        doc={editDoc as unknown as PublicDocumentItem}
        categories={categories as import("../../services/documentService").DocumentCategoryDTO[]}
        onSave={(updated) => {
          setDocs((prev) =>
            prev.map((it) =>
              it.id === (updated as PublicDocumentItem).id
                ? ((updated as unknown as DocumentDTO) ?? it)
                : it
            )
          );
        }}
        onSubmitUpdate={
          handleEditSubmit as unknown as (
            id: string,
            patch: { title: string; description: string | null; status: DocumentStatus; categoryId: string | null }
          ) => Promise<import("../../services/documentService").PublicDocumentItem>
        }
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-50 text-gray-700",
        className
      )}
    >
      <span className="font-bold">{label}:</span>
      <span className="font-extrabold">{value}</span>
    </span>
  );
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, { label: string; cls: string }> = {
    PUBLISHED: { label: "Publicado", cls: "bg-green-100 text-green-700" },
    HIDDEN: { label: "Oculto", cls: "bg-gray-100 text-gray-700" },
    ARCHIVED: { label: "Arquivado", cls: "bg-amber-100 text-amber-800" },
  };

  const item = map[status];

  return (
    <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", item.cls)}>
      {item.label}
    </span>
  );
}
