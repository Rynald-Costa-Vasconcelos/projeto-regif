// src/features/news/components/public/post/NewsPostHeader.tsx
import type { PublicNewsDetail } from "../../../types";

export function NewsPostHeader({ data }: { data: PublicNewsDetail }) {
  return (
    <header className="p-6 md:p-10 border-b border-gray-50">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] text-regif-blue font-bold uppercase tracking-wider">
          {data.category?.name || "Notícias"}
        </span>
      </div>

      <h1 className="text-2xl md:text-4xl font-extrabold text-regif-dark leading-tight tracking-tight [overflow-wrap:anywhere]">
        {data.title}
      </h1>

      {data.excerpt?.trim() && (
        <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl [overflow-wrap:anywhere]">
          {data.excerpt}
        </p>
      )}

      <div className="mt-5 text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
        <time className="font-medium text-gray-700">
          {new Date(data.createdAt).toLocaleDateString("pt-BR")}
        </time>
        {data.author?.name ? <span>• por {data.author.name}</span> : null}
        {typeof data.views === "number" ? (
          <span className="text-gray-400">• {data.views} views</span>
        ) : null}
      </div>
    </header>
  );
}
