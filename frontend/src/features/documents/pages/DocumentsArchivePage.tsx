import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

import { useDocumentsArchive } from "../hooks/useDocumentsArchive";
import { DocumentsHeader } from "../components/DocumentsHeader";
import { DocumentsFilters } from "../components/DocumentsFilters";
import { DocumentsActiveChips } from "../components/DocumentsActiveChips";
import { DocumentCard } from "../components/DocumentCard";
import { DocumentsPagination } from "../components/DocumentsPagination";

export function DocumentsArchivePage() {
  const archive = useDocumentsArchive();

  // ✅ estado de UI (mobile) fica na página
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Link
          to="/"
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
            "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a Home
        </Link>
      </div>

      <DocumentsHeader
        hasActiveFilters={archive.hasActiveFilters}
        onClearFilters={() => {
          archive.clearFilters();
          setFiltersOpenMobile(false);
        }}
        filtersOpenMobile={filtersOpenMobile}
        onToggleFiltersMobile={() => setFiltersOpenMobile((v) => !v)}
      />

      <DocumentsActiveChips archive={archive} />

      <DocumentsFilters
        draft={archive.draft}
        setDraft={archive.setDraft}
        categories={archive.categories}
        loadingCats={archive.loadingCats}
        isOpenMobile={filtersOpenMobile}
        onLast30Days={archive.setLast30DaysDraft}
        onApply={() => {
          archive.applyFilters();
          setFiltersOpenMobile(false);
        }}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {archive.items.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onDownload={archive.fetchArchive}
            bumpDownloadsLocal={archive.bumpDownloadsLocal}
          />
        ))}
      </div>

      <DocumentsPagination archive={archive} />
    </div>
  );
}
