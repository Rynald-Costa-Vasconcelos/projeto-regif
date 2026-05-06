import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  LayoutGrid,
  Loader2,
  NotebookPen,
  PartyPopper,
  Shirt,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

import lojinhaMock from "../../assets/mock_lojinha.webp";
import { ShopProductCard } from "../../features/shop/ShopProductCard";
import {
  listPublicShopCategories,
  listPublicShopProducts,
  type ShopPublicCategory,
  type ShopPublicProduct,
} from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

const CATEGORY_SHORTCUT_STYLE: Record<
  string,
  { Icon: LucideIcon; ring: string; iconWrap: string; iconColor: string }
> = {
  "vestuario-e-acessorios": {
    Icon: Shirt,
    ring: "ring-rose-100/80",
    iconWrap: "bg-gradient-to-br from-rose-50 to-orange-50",
    iconColor: "text-rose-600",
  },
  "papelaria-e-escritorio": {
    Icon: NotebookPen,
    ring: "ring-amber-100/80",
    iconWrap: "bg-gradient-to-br from-amber-50 to-yellow-50",
    iconColor: "text-amber-700",
  },
  "utensilios-e-lifestyle": {
    Icon: Sparkles,
    ring: "ring-teal-100/80",
    iconWrap: "bg-gradient-to-br from-teal-50 to-emerald-50",
    iconColor: "text-teal-700",
  },
  "tecnologia-e-eletronicos": {
    Icon: Cpu,
    ring: "ring-blue-100/80",
    iconWrap: "bg-gradient-to-br from-blue-50 to-indigo-50",
    iconColor: "text-regif-blue",
  },
  "categorias-especiais-e-eventos": {
    Icon: PartyPopper,
    ring: "ring-violet-100/80",
    iconWrap: "bg-gradient-to-br from-violet-50 to-fuchsia-50",
    iconColor: "text-violet-700",
  },
  diversos: {
    Icon: LayoutGrid,
    ring: "ring-slate-200/80",
    iconWrap: "bg-gradient-to-br from-slate-50 to-gray-100",
    iconColor: "text-slate-700",
  },
};

export function ShopHome() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const thanks = (location.state as { orderThanks?: { publicNumber: string; grandTotal: string } } | null)
    ?.orderThanks;

  const searchQuery = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("categoria") ?? "";

  const [shopCategories, setShopCategories] = useState<ShopPublicCategory[]>([]);
  const [products, setProducts] = useState<ShopPublicProduct[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await listPublicShopCategories();
        if (!cancelled) setShopCategories(cats);
      } catch {
        if (!cancelled) setShopCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parentCategories = useMemo(() => {
    return shopCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [shopCategories]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categorySlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await listPublicShopProducts({
          page,
          pageSize: 12,
          q: searchQuery.trim() || undefined,
          categorySlug: categorySlug || undefined,
        });
        if (cancelled) return;
        setProducts(res.items);
        if (res.meta) setMeta(res.meta);
      } catch (e) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, searchQuery, categorySlug]);

  const activeFiltersLabel = useMemo(() => {
    const parts: string[] = [];
    if (searchQuery.trim()) parts.push(`“${searchQuery.trim()}”`);
    if (categorySlug) parts.push("categoria aplicada");
    return parts.length ? parts.join(" · ") : null;
  }, [searchQuery, categorySlug]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {thanks && (
        <div className="border-b border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-900">
          Pedido <strong>{thanks.publicNumber}</strong> registrado! Total {thanks.grandTotal}. A equipe entrará em
          contato sobre pagamento e entrega.
        </div>
      )}

      {/* Destaque — linguagem visual alinhada ao hero da home */}
      <section className="relative overflow-hidden bg-regif-blue text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-regif-green/15 blur-[100px]" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-400/15 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-16 lg:gap-14 lg:px-6">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-100 backdrop-blur-sm md:justify-start">
              <ShoppingBag size={14} className="text-regif-green" aria-hidden />
              Lojinha oficial
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Vista a camisa do{" "}
              <span className="text-transparent bg-gradient-to-r from-regif-green to-teal-300 bg-clip-text">movimento</span>.
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-blue-100 md:mx-0 lg:text-lg">
              Produtos da REGIF com preços transparentes. Monte seu pedido aqui; pagamento e envio são confirmados pela
              equipe após o registro.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
              <a
                href="#catalogo-lojinha"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-regif-blue shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gray-100"
              >
                Ver catálogo <ArrowRight size={18} />
              </a>
              <Link
                to="/loja/finalizar"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Ir ao carrinho
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
              <img
                src={lojinhaMock}
                alt="Prévia de produtos da lojinha REGIF"
                className="h-auto w-full rounded-2xl object-cover shadow-inner"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 lg:px-6">
        {parentCategories.length > 0 && (
          <section aria-labelledby="categorias-loja-heading" className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="categorias-loja-heading" className="text-xl font-bold text-regif-dark md:text-2xl">
                  Explore por categoria
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Atalhos para os departamentos da lojinha oficial.
                </p>
              </div>
              <a
                href="#catalogo-lojinha"
                className="text-sm font-bold text-regif-blue underline-offset-4 hover:underline"
              >
                Ver catálogo completo
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {parentCategories.map((cat) => {
                const style = CATEGORY_SHORTCUT_STYLE[cat.slug] ?? {
                  Icon: LayoutGrid,
                  ring: "ring-gray-100",
                  iconWrap: "bg-gray-50",
                  iconColor: "text-regif-dark",
                };
                const Icon = style.Icon;
                return (
                  <Link
                    key={cat.id}
                    to={`/loja/categoria/${encodeURIComponent(cat.slug)}`}
                    className={clsx(
                      "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-transparent transition",
                      "hover:-translate-y-1 hover:shadow-md hover:ring-regif-blue/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-regif-blue",
                      style.ring
                    )}
                  >
                    <div
                      className={clsx(
                        "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition group-hover:scale-[1.04]",
                        style.iconWrap
                      )}
                      aria-hidden
                    >
                      <Icon size={28} strokeWidth={2} className={style.iconColor} />
                    </div>
                    <h3 className="text-center text-sm font-extrabold leading-snug text-regif-dark transition group-hover:text-regif-blue">
                      {cat.name}
                    </h3>
                    <p className="mt-2 text-center text-xs font-semibold text-regif-green opacity-0 transition group-hover:opacity-100">
                      Ver produtos
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section id="catalogo-lojinha" className="scroll-mt-28 space-y-4">
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-regif-dark md:text-2xl">Catálogo</h2>
              {activeFiltersLabel ? (
                <p className="mt-1 text-sm text-gray-600">
                  Filtros: <span className="font-semibold text-regif-dark">{activeFiltersLabel}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-600">Explore todos os itens disponíveis.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-20 text-regif-blue">
              <Loader2 className="animate-spin" size={36} />
            </div>
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ShopProductCard key={p.id} product={p} />
                ))}
              </div>
              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Página {page} de {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
