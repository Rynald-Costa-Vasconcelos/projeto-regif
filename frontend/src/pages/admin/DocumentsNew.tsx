// src/pages/admin/DocumentsNew.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  Trash2,
  RefreshCcw,
  Tag,
  ShieldCheck,
  Info,
} from "lucide-react";
import clsx from "clsx";
import type { AxiosError } from "axios";

import { api } from "../../lib/api";
import { PdfViewer } from "../../components/PdfViewer";

import {
  createDocument,
  listAdminDocumentCategories,
  type DocumentStatus,
  type DocumentCategoryDTO,
} from "../../services/documentService";

type ApiError = {
  message: string;
  code?: string;
  status?: number;
  url?: string;
};
type ErrorPayload = { message?: string; mensagem?: string };

function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<ErrorPayload>;
  const status = e.response?.status;
  const baseURL = (e.config?.baseURL ?? api.defaults.baseURL ?? "").toString();
  const url = e.config?.url ? `${baseURL}${e.config.url}` : baseURL || undefined;

  let message = e.message || "Erro inesperado";
  const code = e.code;

  if (code === "ECONNABORTED") message = "Tempo limite excedido ao consultar a API.";
  if (status === 400) message = "Dados inválidos. Verifique título/arquivo.";
  if (status === 401) message = "Sessão expirada ou token ausente. Faça login novamente.";
  if (status === 403) message = "Você não tem permissão (precisa ser ADMIN/EDITOR).";
  if (status === 404) message = "Endpoint não encontrado.";

  return { message, code, status, url };
}

function humanizeSaveError(err: AxiosError<ErrorPayload>) {
  const status = err.response?.status;

  if (err.code === "ECONNABORTED")
    return "Tempo limite excedido ao enviar o documento. Tente novamente.";
  if (status === 400) {
    const data = err.response?.data;
    const msg = data?.message ? String(data.message) : "Dados inválidos.";
    return `${msg} (Confira título e selecione um PDF válido)`;
  }
  if (status === 401) return "Você não está autenticado. Faça login novamente.";
  if (status === 403) return "Você não tem permissão (precisa ser ADMIN/EDITOR).";
  return "Erro inesperado ao criar o documento.";
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let b = bytes;
  let u = 0;
  while (b >= 1024 && u < units.length - 1) {
    b /= 1024;
    u++;
  }
  return `${b.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

function isPdf(file: File) {
  // Alguns navegadores retornam vazio; então também checamos extensão
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function DocumentsNew() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DocumentStatus>("PUBLISHED");
  const [categoryId, setCategoryId] = useState("");

  // file
  const [file, setFile] = useState<File | null>(null);

  // ✅ (novo) ref do input file pra poder limpar quando clicar em "Remover"
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // categories
  const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // slug “visual” (não envia, só feedback pro usuário)
  const previewSlug = useMemo(() => {
    const t = title
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
    return t || "titulo-do-documento";
  }, [title]);

  useEffect(() => {
    fetchCategories();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCategories() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      // ✅ usando seu service do front
      const list = await listAdminDocumentCategories({ signal: controller.signal });

      if (!controller.signal.aborted) setCategories(list);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "CanceledError") return;
      if (!controller.signal.aborted) {
        setCategories([]);
        setCategoriesError(toApiError(err).message);
      }
    } finally {
      if (!controller.signal.aborted) setCategoriesLoading(false);
    }
  }

  function validate(): string | null {
    if (title.trim().length < 3) return "O título deve ter pelo menos 3 caracteres.";
    if (!file) return "Selecione um arquivo PDF antes de salvar.";
    if (!isPdf(file)) return "O arquivo selecionado não é um PDF.";
    // 50MB “safe default” (ajuste se quiser)
    if (file.size > 50 * 1024 * 1024) return "PDF muito grande (limite recomendado: 50MB).";
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    setSaving(true);
    try {
      await createDocument({
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        status,
        categoryId: categoryId.trim() ? categoryId.trim() : null,
        file: file!,
      });

      navigate("/admin/documents");
    } catch (err) {
      const e = err as AxiosError<ErrorPayload>;
      console.error("Erro ao criar documento:", e.response?.data ?? e.message);
      setFormError(
        e.response ? humanizeSaveError(e) : (err as { message?: string })?.message ?? "Erro inesperado."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/documents")}
            className="p-2 text-gray-400 hover:text-regif-blue hover:bg-gray-100 rounded-xl"
            title="Voltar para Documentos"
          >
            <ArrowLeft size={24} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-regif-dark">Novo Documento</h1>
            <p className="text-sm text-gray-500">
              Envie um PDF e publique no Portal da Transparência.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={clsx(
            "px-6 py-2.5 bg-regif-green text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2",
            saving ? "opacity-70 cursor-not-allowed" : "hover:bg-green-600"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Salvando...
            </>
          ) : (
            <>
              <Save size={18} /> Salvar
            </>
          )}
        </button>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="mt-0.5" size={18} />
          <div className="text-sm">
            <p className="font-bold">Não foi possível salvar</p>
            <p className="text-red-700">{formError}</p>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN */}
        <div className="lg:col-span-8 space-y-6">
          {/* Título + descrição */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText size={16} /> Título
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-regif-blue/20 outline-none font-semibold"
                placeholder="Ex: Relatório Financeiro - Jan/2026"
                required
              />

              <p className="text-[10px] text-gray-400 font-mono">
                URL pública (prevista): /documentos/{previewSlug}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Descrição (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl h-24 resize-none text-sm"
                placeholder="Resumo do documento para facilitar busca e entendimento…"
              />
            </div>
          </div>

          {/* Upload + preview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Upload size={16} /> PDF
                </p>
                <p className="text-[11px] text-gray-500">
                  Selecione o arquivo e confira o preview antes de salvar.
                </p>
              </div>

              {file && (
                <button
                  type="button"
                  onClick={() => {
                    // ✅ mantém sua lógica (file = null) e agora também limpa o input visualmente
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>

            <input
              ref={fileInputRef} // ✅ (novo)
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                // ❌ removido: e.currentTarget.value = ""
                setFormError(null);
                setFile(f);
              }}
              className="block w-full text-xs"
              required
            />

            {/* Info do arquivo */}
            {file ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 border rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Arquivo</p>
                  <p className="text-xs font-semibold text-gray-800 break-words">{file.name}</p>
                </div>
                <div className="bg-gray-50 border rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Tamanho</p>
                  <p className="text-xs font-semibold text-gray-800">{formatBytes(file.size)}</p>
                </div>
                <div className="bg-gray-50 border rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Tipo</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {isPdf(file) ? "PDF" : file.type || "desconhecido"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 bg-gray-50 border rounded-xl p-3 flex gap-2 items-start">
                <Info size={14} className="mt-0.5" />
                <div>
                  <b>Dica:</b> use PDFs leves quando possível. O preview ajuda a confirmar que o
                  arquivo correto foi anexado.
                </div>
              </div>
            )}

            <div className="pt-2">
              <PdfViewer file={file} />
            </div>
          </div>

          <div className="text-[11px] text-gray-500">
            <RouterLink to="/admin/documents" className="text-regif-blue font-bold hover:underline">
              Voltar para lista de documentos
            </RouterLink>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
          {/* Configurações */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Configurações</h3>
              <span className="text-[10px] text-gray-400">Documento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <ShieldCheck size={14} /> Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full p-3 bg-gray-50 border rounded-xl text-sm"
                >
                  <option value="PUBLISHED">Publicado</option>
                  <option value="HIDDEN">Oculto</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>

                <p className="text-[10px] text-gray-400">
                  Público só enxerga <b>PUBLISHED</b>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Tag size={14} /> Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categoriesLoading}
                  className="w-full p-3 bg-gray-50 border rounded-xl text-sm disabled:opacity-60"
                >
                  <option value="">{categoriesLoading ? "Carregando..." : "Sem categoria"}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {categoriesError ? (
                  <p className="text-[10px] text-red-600">{categoriesError}</p>
                ) : (
                  <p className="text-[10px] text-gray-400">
                    Categorias organizam o portal e melhoram busca.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={fetchCategories}
              disabled={categoriesLoading}
              className={clsx(
                "w-full px-4 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2",
                categoriesLoading ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "hover:bg-gray-50"
              )}
            >
              <RefreshCcw size={14} />
              {categoriesLoading ? "Atualizando..." : "Recarregar categorias"}
            </button>
          </div>

          {/* Card de boas práticas */}
          <div className="bg-gray-50 border rounded-2xl p-4 text-[11px] text-gray-600 space-y-2">
            <p className="font-bold text-gray-700">Boas práticas</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use títulos padronizados (ex.: “Prestação de Contas - Mês/Ano”).</li>
              <li>Descreva o que o PDF contém em 1 linha.</li>
              <li>Evite PDFs gigantes quando possível.</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
