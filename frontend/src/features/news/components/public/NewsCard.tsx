// src/features/news/components/public/NewsCard.tsx
import { Link } from "react-router-dom";
import type { PublicNewsItem } from "../../types";

function formatDateBR(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NewsCard({ post }: { post: PublicNewsItem }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9] w-full bg-slate-100">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
            Sem imagem
          </div>
        )}

        {post.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white">
            DESTAQUE
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          {post.category?.name && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-black text-slate-700">
              {post.category.name}
            </span>
          )}
          <span>{formatDateBR(post.createdAt)}</span>
          {post.author?.name && <span className="text-slate-500">• {post.author.name}</span>}
        </div>

        <h2 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-900">
          <Link to={`/noticias/${post.slug}`} className="outline-none focus:underline">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}

        <div className="mt-3">
          <Link to={`/noticias/${post.slug}`} className="text-sm font-black text-slate-900 hover:underline">
            Ler notícia →
          </Link>
        </div>
      </div>
    </article>
  );
}
