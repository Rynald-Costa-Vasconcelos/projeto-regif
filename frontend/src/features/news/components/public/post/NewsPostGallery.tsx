// src/features/news/components/public/post/NewsPostGallery.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { NewsAsset } from "../../../types";

export function NewsPostGallery({
  enabled,
  gallery,
  activeIndex,
  activeImage,
  onSelect,
  onPrev,
  onNext,
  mediaUrl,
}: {
  enabled: boolean;
  gallery: NewsAsset[];
  activeIndex: number;
  activeImage?: NewsAsset;
  onSelect: (idx: number) => void;
  onPrev: () => void;
  onNext: () => void;
  mediaUrl: (u?: string | null) => string;
}) {
  if (!enabled || gallery.length === 0) return null;

  return (
    <section className="mt-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold text-regif-dark">
          Galeria ({gallery.length})
        </h2>

        {gallery.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="p-2 rounded-xl border hover:bg-gray-50"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-2 rounded-xl border hover:bg-gray-50"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {activeImage && (
        <div className="rounded-2xl overflow-hidden border bg-gray-50">
          <img
            src={mediaUrl(activeImage.url)}
            alt={activeImage.caption?.trim() ? activeImage.caption : `Imagem ${activeIndex + 1}`}
            className="w-full aspect-video object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='16'%3EImagem n%C3%A3o carregou%3C/text%3E%3C/svg%3E";
            }}
          />

          {activeImage.caption?.trim() && (
            <div className="p-3 text-xs text-gray-600 border-t bg-white [overflow-wrap:anywhere]">
              {activeImage.caption}
            </div>
          )}
        </div>
      )}

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {gallery.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(idx)}
              className={clsx(
                "aspect-video rounded-xl overflow-hidden border bg-gray-100",
                idx === activeIndex ? "ring-2 ring-regif-blue" : "opacity-80 hover:opacity-100"
              )}
              title={`Imagem ${idx + 1}`}
              aria-label={`Selecionar imagem ${idx + 1}`}
            >
              <img
                src={mediaUrl(img.thumbUrl || img.url)}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
