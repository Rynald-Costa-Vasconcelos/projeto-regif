// src/features/news/components/public/post/NewsPostLinks.tsx
import { ExternalLink } from "lucide-react";
import type { NewsLink } from "../../../types";

export function NewsPostLinks({
  enabled,
  links,
  safeDomain,
}: {
  enabled: boolean;
  links: NewsLink[];
  safeDomain: (url: string) => string;
}) {
  if (!enabled || links.length === 0) return null;

  return (
    <section className="mt-12 max-w-5xl mx-auto">
      <h2 className="text-sm font-extrabold text-regif-dark mb-3">
        Links relacionados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group p-4 rounded-2xl border bg-white hover:bg-gray-50 transition-all flex gap-3 min-w-0"
            title={l.url}
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-regif-blue/10 text-regif-blue flex items-center justify-center">
              <ExternalLink size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-900 group-hover:text-regif-blue truncate">
                {l.title?.trim() || safeDomain(l.url)}
              </p>

              {l.description?.trim() ? (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2 [overflow-wrap:anywhere]">
                  {l.description}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1 truncate">{l.url}</p>
              )}

              <p className="text-[10px] text-gray-400 mt-2 truncate">{safeDomain(l.url)}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
