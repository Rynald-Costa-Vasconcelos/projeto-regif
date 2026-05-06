import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { X, Save, FileText, Tag, Eye, EyeOff, Archive } from "lucide-react";

import type {
  DocumentCategoryDTO,
  DocumentStatus,
  PublicDocumentItem,
} from "../../services/documentService";

type FormValues = {
  title: string;
  description: string;
  status: DocumentStatus;
  categoryId: string; // "" = sem categoria
};

type Props = {
  open: boolean;
  onClose: () => void;
  doc: PublicDocumentItem | null;
  categories: DocumentCategoryDTO[];
  onSave: (updated: PublicDocumentItem) => void;
  onSubmitUpdate: (
    id: string,
    patch: {
      title: string;
      description: string | null;
      status: DocumentStatus;
      categoryId: string | null;
    }
  ) => Promise<PublicDocumentItem>;
};

export function EditDocumentModal({
  open,
  onClose,
  doc,
  categories,
  onSave,
  onSubmitUpdate,
}: Props) {
  const [values, setValues] = useState<FormValues>({
    title: "",
    description: "",
    status: "PUBLISHED",
    categoryId: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  const titleRef = useRef<HTMLInputElement | null>(null);

  const initial = useMemo<FormValues>(() => {
    return {
      title: doc?.title ?? "",
      description: doc?.description ?? "",
      status: (doc?.status ?? "PUBLISHED") as DocumentStatus,
      categoryId: doc?.category?.id ?? (doc as any)?.categoryId ?? "",
    };
  }, [doc]);

  useEffect(() => {
    if (!open) return;
    setValues(initial);
    setErr("");
    // foca no título
    setTimeout(() => titleRef.current?.focus(), 0);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const statusChip = (s: DocumentStatus) => {
    if (s === "PUBLISHED")
      return { label: "Publicado", cls: "bg-green-50 border-green-200 text-green-700", Icon: Eye };
    if (s === "HIDDEN")
      return { label: "Oculto", cls: "bg-gray-50 border-gray-200 text-gray-700", Icon: EyeOff };
    return { label: "Arquivado", cls: "bg-amber-50 border-amber-200 text-amber-800", Icon: Archive };
  };

  const st = statusChip(values.status);

  async function handleSave() {
    if (!doc) return;

    const title = values.title.trim();
    if (title.length < 3) {
      setErr("O título deve ter pelo menos 3 caracteres.");
      titleRef.current?.focus();
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const patch = {
        title,
        description: values.description.trim() ? values.description.trim() : null,
        status: values.status,
        categoryId: values.categoryId ? values.categoryId : null,
      };

      const updated = await onSubmitUpdate(doc.id, patch);
      onSave(updated);
      onClose();
    } catch {
      setErr("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* header */}
          <div className="flex items-start justify-between gap-3 p-5 border-b">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-regif-blue" />
                <h2 className="text-lg font-extrabold text-gray-900">Editar documento</h2>

                <span
                  className={clsx(
                    "ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black",
                    st.cls
                  )}
                >
                  <st.Icon className="h-4 w-4" />
                  {st.label}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500 truncate">
                {doc?.originalName || "—"} • {doc?.sizeBytes ? `${Math.round(doc.sizeBytes / 1024)} KB` : "—"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-gray-100 transition"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* body */}
          <div className="p-5 space-y-4">
            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-extrabold">Ops:</span> {err}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {/* título */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-800">Título</label>
                <input
                  ref={titleRef}
                  value={values.title}
                  onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                  className={clsx(
                    "mt-1 w-full rounded-xl border bg-gray-50 px-3 py-2.5 outline-none transition",
                    "focus:bg-white focus:ring-2 focus:ring-regif-blue/20",
                    values.title.trim().length > 0 && values.title.trim().length < 3
                      ? "border-red-300"
                      : "border-gray-200"
                  )}
                  placeholder="Ex.: Relatório de Gestão 2026"
                />
              </div>

              {/* status */}
              <div>
                <label className="text-sm font-bold text-gray-800">Status</label>
                <select
                  value={values.status}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, status: e.target.value as DocumentStatus }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-regif-blue/20 transition"
                >
                  <option value="PUBLISHED">Publicado</option>
                  <option value="HIDDEN">Oculto</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
              </div>

              {/* categoria */}
              <div>
                <label className="text-sm font-bold text-gray-800">Categoria</label>
                <div className="relative mt-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={values.categoryId}
                    onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-regif-blue/20 transition"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* descrição */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-800">
                  Descrição <span className="text-gray-400 font-semibold">(opcional)</span>
                </label>
                <textarea
                  value={values.description}
                  onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-regif-blue/20 transition resize-none"
                  placeholder="Resumo curto do documento…"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 px-4 py-3 text-xs text-gray-600">
              <span className="font-extrabold text-gray-800">Obs.:</span>{" "}
              este modal edita apenas metadados. Para trocar o PDF, exclua e crie um novo documento.
            </div>
          </div>

          {/* footer */}
          <div className="p-5 border-t flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border bg-white hover:bg-gray-50 transition font-extrabold text-sm text-gray-700"
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={clsx(
                "h-11 px-5 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow transition active:scale-[0.99]",
                saving
                  ? "bg-blue-200 text-white cursor-not-allowed"
                  : "bg-regif-blue text-white hover:bg-blue-700"
              )}
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
