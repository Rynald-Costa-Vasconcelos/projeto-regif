import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, X, ZoomIn } from "lucide-react";
import clsx from "clsx";

import { useShopCart } from "../../features/shop/ShopCartContext";
import { getPublicShopProductBySlug, type ShopPublicProduct } from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

function formatBrl(value: string | number | null | undefined) {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function sortProductImages(images: ShopPublicProduct["images"]) {
  return [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

function primaryImage(p: ShopPublicProduct) {
  const prim = p.images.find((i) => i.isPrimary);
  const img = prim ?? p.images[0];
  return img?.url || img?.thumbUrl || null;
}

function imageDisplayUrl(im: ShopPublicProduct["images"][number] | undefined) {
  if (!im) return null;
  return im.url || im.thumbUrl || null;
}

export function ShopProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addLine, lines } = useShopCart();
  const [product, setProduct] = useState<ShopPublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMsg, setAddedMsg] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const p = await getPublicShopProductBySlug(slug);
        if (cancelled) return;
        setProduct(p);
        setActiveIndex(0);
        setLightboxOpen(false);
      } catch (e) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const orderedImages = useMemo(
    () => (product ? sortProductImages(product.images) : []),
    [product]
  );
  const galleryLen = orderedImages.length;

  const goPrev = useCallback(() => {
    if (galleryLen < 2) return;
    setActiveIndex((i) => (i - 1 + galleryLen) % galleryLen);
  }, [galleryLen]);

  const goNext = useCallback(() => {
    if (galleryLen < 2) return;
    setActiveIndex((i) => (i + 1) % galleryLen);
  }, [galleryLen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (galleryLen < 2) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + galleryLen) % galleryLen);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % galleryLen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, galleryLen]);

  const inCartQty = product ? lines.find((l) => l.productId === product.id)?.quantity ?? 0 : 0;
  const soldOut = product ? product.stockQuantity <= 0 : false;
  const canBuy = product ? !soldOut && product.stockQuantity > inCartQty : false;

  const onAdd = () => {
    if (!product || !canBuy) return;
    addLine({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      unitPrice: product.price,
      imageUrl: primaryImage(product),
      quantity: 1,
    });
    setAddedMsg(true);
    window.setTimeout(() => setAddedMsg(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-regif-blue">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-20 text-center">
        <p className="font-medium text-red-700">{error ?? "Produto não encontrado."}</p>
        <Link to="/loja" className="font-bold text-regif-blue underline">
          Voltar à loja
        </Link>
      </div>
    );
  }

  const activeImage = orderedImages[activeIndex];
  const hero = imageDisplayUrl(activeImage) ?? primaryImage(product);
  const heroAlt = activeImage?.alt?.trim() || product.title;

  const stockLabel = soldOut
    ? "Este produto está esgotado no momento."
    : product.stockQuantity <= 5
      ? `Últimas unidades (${product.stockQuantity} disponíveis)`
      : `Em estoque (${product.stockQuantity} disponíveis)`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 pb-2 pt-6">
        <Link
          to="/loja"
          className="group inline-flex items-center gap-2 rounded-full border-2 border-regif-blue/15 bg-white px-4 py-2.5 text-sm font-bold text-regif-blue shadow-sm transition-all duration-200 hover:border-regif-green hover:bg-regif-blue hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green focus-visible:ring-offset-2"
        >
          <ArrowLeft
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden
          />
          Voltar ao catálogo
        </Link>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div
            className={clsx(
              "group/image relative aspect-square overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.04]",
              soldOut && "grayscale-[0.35]"
            )}
          >
            {hero ? (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="relative block h-full w-full cursor-zoom-in p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green focus-visible:ring-offset-2"
                  aria-label={`Ampliar imagem: ${product.title}`}
                >
                  <img
                    key={activeImage?.id ?? "main"}
                    src={hero}
                    alt={heroAlt}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover/image:scale-100 group-hover/image:scale-[1.06]"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 via-transparent to-transparent pb-4 opacity-0 transition-opacity duration-300 group-hover/image:opacity-100 motion-reduce:opacity-0"
                    aria-hidden
                  >
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-regif-dark shadow-md backdrop-blur-sm">
                      <ZoomIn className="h-3.5 w-3.5 shrink-0 text-regif-green" />
                      Ampliar
                    </span>
                  </span>
                </button>
                {galleryLen > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-regif-dark/80 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-regif-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green md:left-3 md:h-11 md:w-11"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-regif-dark/80 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-regif-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green md:right-3 md:h-11 md:w-11"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                    </button>
                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-regif-dark/65 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
                      {activeIndex + 1} / {galleryLen}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">Sem imagem</div>
            )}
            {soldOut && hero && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30">
                <span className="rounded-full border border-rose-100 bg-white/95 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-rose-800 shadow-lg">
                  Esgotado
                </span>
              </div>
            )}
          </div>

          {galleryLen > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {orderedImages.map((im, idx) => (
                <button
                  key={im.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={clsx(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 md:h-[4.5rem] md:w-[4.5rem]",
                    idx === activeIndex
                      ? "scale-[1.02] border-regif-green shadow-md ring-2 ring-regif-green/30"
                      : "border-gray-200 opacity-90 hover:border-regif-blue/45 hover:opacity-100 hover:shadow-sm"
                  )}
                  aria-label={`Ver imagem ${idx + 1} de ${galleryLen}`}
                  aria-current={idx === activeIndex ? "true" : undefined}
                >
                  <img
                    src={im.thumbUrl || im.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-regif-green tracking-widest uppercase">Lojinha REGIF</p>
            <h1 className="text-3xl md:text-4xl font-bold text-regif-dark mt-1">{product.title}</h1>
            {product.excerpt && <p className="text-gray-600 mt-3">{product.excerpt}</p>}
          </div>

          <div className="space-y-2">
            <p className={clsx("text-2xl font-black", soldOut ? "text-gray-400" : "text-regif-green")}>
              {formatBrl(product.price)}
            </p>
            {product.compareAtPrice && (
              <p className="text-sm text-gray-400 line-through">{formatBrl(product.compareAtPrice)}</p>
            )}
            <p
              className={clsx(
                "text-sm font-medium",
                soldOut ? "text-rose-800 font-semibold" : "text-gray-700"
              )}
            >
              {stockLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={onAdd}
              disabled={!canBuy}
              className="px-6 py-3 rounded-full bg-regif-blue text-white font-bold shadow-md transition hover:bg-blue-800 hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {soldOut ? "Indisponível" : "Adicionar ao carrinho"}
            </button>
            {addedMsg && <span className="text-sm text-green-700 font-semibold">Adicionado!</span>}
          </div>

          {product.specifications.length > 0 && (
            <div>
              <h2 className="font-bold text-regif-dark mb-2">Especificações</h2>
              <dl className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                {product.specifications.map((s) => (
                  <div key={s.id} className="flex justify-between gap-4 px-4 py-2 text-sm">
                    <dt className="text-gray-500">{s.label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.description?.trim() ? (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="font-bold text-regif-dark mb-3">Descrição</h2>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {lightboxOpen && hero ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da galeria"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-regif-dark/92 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-3 top-3 z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green md:right-5 md:top-5"
            aria-label="Fechar visualização"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            <X className="h-6 w-6" aria-hidden />
          </button>

          {galleryLen > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-[110] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green md:left-6 md:h-12 md:w-12"
                aria-label="Imagem anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-[110] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-regif-green md:right-6 md:h-12 md:w-12"
                aria-label="Próxima imagem"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
              </button>
              <p className="pointer-events-none absolute bottom-4 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
                {activeIndex + 1} / {galleryLen}
              </p>
            </>
          )}

          <img
            src={hero}
            alt={heroAlt}
            className="max-h-[min(88vh,960px)] max-w-[min(96vw,1200px)] select-none rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
