// src/features/news/components/public/post/NewsPostError.tsx
import { ServerCrash } from "lucide-react";

export function NewsPostError({
  error,
}: {
  error: { message: string; code?: string; status?: number; url?: string };
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="bg-red-50 p-6 flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm text-red-600">
          <ServerCrash size={32} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-red-900">Falha ao carregar</h3>
          <p className="text-red-700 text-sm mt-1 [overflow-wrap:anywhere]">
            {error.message}
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <ErrorDetail label="Endpoint" value={error.url || "N/A"} />
            <ErrorDetail label="Código" value={error.code || "N/A"} />
            <ErrorDetail label="HTTP Status" value={error.status ?? "Sem resposta"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorDetail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
        {label}
      </p>
      <p className="text-sm font-mono text-gray-700 break-all">{value}</p>
    </div>
  );
}
