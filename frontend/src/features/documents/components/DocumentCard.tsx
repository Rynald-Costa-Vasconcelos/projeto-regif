// src/features/documents/components/DocumentCard.tsx
import clsx from "clsx";
import { Download, ExternalLink, FileText } from "lucide-react";

import type { PublicDocumentItem } from "../../../services/documentService";
import { formatDateBR, pickDateForDisplay } from "../utils";

type DocumentCardProps = {
  doc: PublicDocumentItem;

  /**
   * ✅ Callback pra “sincronizar” com o backend depois do download.
   * Na page você está passando: onDownload={archive.fetchArchive}
   */
  onDownload: () => void;

  /**
   * ✅ Feedback imediato (incrementa na UI antes do backend responder).
   */
  bumpDownloadsLocal: (id: string) => void;
};

// ✅ Abre/baixa via <a> (mais estável que fetch + redirect)
function openCountingUrl(countingUrl: string, filename?: string | null) {
  const a = document.createElement("a");
  a.href = countingUrl;

  // "download" pode ser ignorado em alguns cenários, mas ajuda no same-origin (/api)
  if (filename) a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DocumentCard({
  doc,
  onDownload,
  bumpDownloadsLocal,
}: DocumentCardProps) {
  const when = pickDateForDisplay(doc);

  // rota que contabiliza downloads e redireciona/serve o arquivo
  const countingUrl = `/api/documents/slug/${encodeURIComponent(
    doc.slug
  )}/download`;

  async function handleDownload() {
    bumpDownloadsLocal(doc.id);

    openCountingUrl(countingUrl, doc.originalName ?? doc.title);

    // sincroniza sem travar UI
    setTimeout(() => {
      onDownload();
    }, 800);
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* header do card (sem imagem) */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <FileText className="h-5 w-5 text-slate-700" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            {doc.category?.name && (
              <span className="rounded-full bg-white px-2.5 py-1 font-black text-slate-700 ring-1 ring-slate-200">
                {doc.category.name}
              </span>
            )}
            <span>{formatDateBR(when)}</span>
          </div>

          <h2 className="mt-1 truncate text-base font-black leading-snug text-slate-900">
            {doc.title}
          </h2>
        </div>
      </div>

      <div className="p-4">
        {doc.description && (
          <p className="mt-1 truncate break-all text-sm text-slate-600">
            {doc.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* ✅ Abrir também contabiliza downloads */}
          <a
            href={countingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
              "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            )}
            title="Abrir em nova aba (contabiliza downloads)"
            onClick={() => bumpDownloadsLocal(doc.id)}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir
          </a>

          <button
            type="button"
            onClick={handleDownload}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black shadow-sm",
              "bg-regif-blue text-white hover:opacity-95"
            )}
            title="Baixar arquivo (contabiliza downloads)"
          >
            <Download className="h-4 w-4" />
            Baixar
          </button>

          <span className="ml-auto text-xs font-semibold text-slate-500">
            {doc.downloads ?? 0} downloads
          </span>
        </div>
      </div>
    </article>
  );
}
