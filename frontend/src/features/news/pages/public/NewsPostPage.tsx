// src/features/news/pages/public/NewsPostPage.tsx
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";

import { useNewsPost } from "../../hooks/useNewsPost";
import { NewsPostLoading } from "../../components/public/post/NewsPostLoading";
import { NewsPostError } from "../../components/public/post/NewsPostError";
import { NewsPostHeader } from "../../components/public/post/NewsPostHeader";
import { NewsPostCover } from "../../components/public/post/NewsPostCover";
import { NewsPostContent } from "../../components/public/post/NewsPostContent";
import { NewsPostGallery } from "../../components/public/post/NewsPostGallery";
import { NewsPostLinks } from "../../components/public/post/NewsPostLinks";
import { NewsPostFooter } from "../../components/public/post/NewsPostFooter";

export default function NewsPostPage() {
  const { slug } = useParams<{ slug?: string }>();
  const {
    data,
    loading,
    error,
    gallery,
    links,
    activeIndex,
    setActiveIndex,
    activeImage,
    prev,
    next,
    mediaUrl,
    safeDomain,
  } = useNewsPost(slug);

  if (!slug) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-700 font-medium">Slug inválido.</p>
          <Link
            to="/noticias"
            className="text-regif-blue font-bold hover:underline inline-flex items-center gap-2 mt-4"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3" id="top">
        <Link
          to="/noticias/arquivo"
          className="inline-flex items-center gap-2 text-regif-blue font-bold hover:underline"
          aria-label="Voltar para Notícias"
        >
          <ArrowLeft size={18} /> Notícias
        </Link>

        {data?.views != null && (
          <div className="text-gray-500 text-sm inline-flex items-center gap-1.5">
            <Eye size={16} className="text-gray-400" />
            <span aria-label="Visualizações">{data.views}</span>
          </div>
        )}
      </div>

      {loading ? (
        <NewsPostLoading />
      ) : error ? (
        <NewsPostError error={error} />
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-700 font-medium">Sem dados para exibir.</p>
        </div>
      ) : (
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <NewsPostHeader data={data} />

          <NewsPostCover
            show={data.showFeaturedImage !== false}
            url={data.coverAsset?.url ?? null}
            mediaUrl={mediaUrl}
          />

          <div className="p-6 md:p-10">
            <NewsPostContent html={data.contentHtml} />

            <NewsPostGallery
              enabled={Boolean(data.enableGallery)}
              gallery={gallery}
              activeIndex={activeIndex}
              activeImage={activeImage}
              onSelect={setActiveIndex}
              onPrev={prev}
              onNext={next}
              mediaUrl={mediaUrl}
            />

            <NewsPostLinks
              enabled={Boolean(data.enableLinks)}
              links={links}
              safeDomain={safeDomain}
            />

            <NewsPostFooter />
          </div>
        </article>
      )}
    </div>
  );
}
