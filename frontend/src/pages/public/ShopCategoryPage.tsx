import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";

import { ShopProductCard } from "../../features/shop/ShopProductCard";
import {
  listPublicShopCategories,
  listPublicShopProducts,
  type ShopPublicCategory,
  type ShopPublicProduct,
} from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

export function ShopCategoryPage() {
  const { parentSlug } = useParams<{ parentSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const subFromUrl = searchParams.get("sub")?.trim() || "";

  const [categories, setCategories] = useState<ShopPublicCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);

  const [products, setProducts] = useState<ShopPublicProduct[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    setCatsError(null);
    (async () => {
      try {
        const items = await listPublicShopCategories();
        if (!cancelled) setCategories(items);
      } catch (e) {
        if (!cancelled) setCatsError(toApiError(e).message);
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parent = useMemo(() => {
    const slug = parentSlug ?? "";
    return categories.find((c) => !c.parentId && c.slug === slug) ?? null;
  }, [categories, parentSlug]);

  const subcategories = useMemo(() => {
    if (!parent) return [];
    return categories
      .filter((c) => c.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, parent]);

  const selectedSubSlug = useMemo(() => {
    if (!subFromUrl) return "";
    const ok = subcategories.some((s) => s.slug === subFromUrl);
    return ok ? subFromUrl : "";
  }, [subFromUrl, subcategories]);

  useEffect(() => {
    if (!subFromUrl || !parent || selectedSubSlug) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("sub");
        return next;
      },
      { replace: true }
    );
  }, [subFromUrl, parent, selectedSubSlug, setSearchParams]);

  const effectiveCategorySlug = selectedSubSlug || parent?.slug || "";

  useEffect(() => {
    setPage(1);
  }, [effectiveCategorySlug]);

  useEffect(() => {
    if (!effectiveCategorySlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await listPublicShopProducts({
          page,
          pageSize: 12,
          categorySlug: effectiveCategorySlug,
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
  }, [page, effectiveCategorySlug]);

  function setSubFilter(next: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("sub", next);
    else nextParams.delete("sub");
    setSearchParams(nextParams, { replace: true });
  }

  const unknownSlug = !catsLoading && !catsError && parentSlug && !parent;

  /** Sem produtos na categoria pai nem em nenhuma filha (filtro “Todas”). */
  const wholeCategoryEmpty =
    Boolean(parent) && !loading && !error && products.length === 0 && !selectedSubSlug;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-6 lg:px-6">
          <Link
            to="/loja#catalogo-lojinha"
            className="inline-flex items-center gap-2 text-sm font-bold text-regif-blue underline-offset-4 hover:underline"
          >
            <ArrowLeft size={18} aria-hidden />
            Voltar à loja
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        {catsLoading ? (
          <div className="flex justify-center py-24 text-regif-blue">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : catsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{catsError}</div>
        ) : unknownSlug ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-regif-dark">Categoria não encontrada.</p>
            <p className="mt-2 text-sm text-gray-600">Confira o endereço ou volte ao catálogo.</p>
            <Link
              to="/loja"
              className="mt-6 inline-flex rounded-full bg-regif-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-regif-dark"
            >
              Ir para a loja
            </Link>
          </div>
        ) : parent ? (
          wholeCategoryEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-24">
              <img
                src="/dog.png"
                alt=""
                className="mx-auto h-auto w-full max-w-[min(320px,92vw)] object-contain"
                loading="lazy"
              />
              <p className="max-w-md text-base leading-relaxed text-gray-600">
                nenhum produto desta categoria está disponível no momento
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full bg-regif-blue px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-regif-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-regif-green focus-visible:ring-offset-2"
              >
                Voltar à home
              </Link>
            </div>
          ) : (
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <aside className="lg:w-64 lg:flex-shrink-0">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-28">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Categoria</p>
                <h1 className="mt-1 text-xl font-extrabold leading-snug text-regif-dark">{parent.name}</h1>
                {parent.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{parent.description}</p>
                )}

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Subcategorias</p>
                  <nav
                    className="mt-3 hidden flex-col gap-1 lg:flex"
                    aria-label="Filtrar por subcategoria"
                  >
                    <button
                      type="button"
                      onClick={() => setSubFilter("")}
                      className={clsx(
                        "rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                        !selectedSubSlug
                          ? "bg-regif-blue text-white shadow-sm"
                          : "text-regif-dark hover:bg-gray-50"
                      )}
                    >
                      Todas
                    </button>
                    {subcategories.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSubFilter(s.slug)}
                        className={clsx(
                          "rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                          selectedSubSlug === s.slug
                            ? "bg-regif-blue text-white shadow-sm"
                            : "text-regif-dark hover:bg-gray-50"
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Mobile-friendly horizontal chips (duplicate navigation pattern) */}
              <div
                className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="navigation"
                aria-label="Filtrar por subcategoria"
              >
                <button
                  type="button"
                  onClick={() => setSubFilter("")}
                  className={clsx(
                    "flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                    !selectedSubSlug
                      ? "border-regif-blue bg-regif-blue text-white"
                      : "border-gray-200 bg-white text-regif-dark"
                  )}
                >
                  Todas
                </button>
                {subcategories.map((s) => (
                  <button
                    key={`chip-${s.id}`}
                    type="button"
                    onClick={() => setSubFilter(s.slug)}
                    className={clsx(
                      "flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                      selectedSubSlug === s.slug
                        ? "border-regif-blue bg-regif-blue text-white"
                        : "border-gray-200 bg-white text-regif-dark"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col space-y-6">
              {!(!loading && products.length === 0 && !error) && (
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-bold text-regif-dark md:text-xl">Produtos</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedSubSlug
                      ? subcategories.find((s) => s.slug === selectedSubSlug)?.name ?? "Subcategoria"
                      : "Todos os itens desta categoria."}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
              )}

              {loading ? (
                <div className="flex justify-center py-20 text-regif-blue">
                  <Loader2 className="animate-spin" size={36} />
                </div>
              ) : products.length === 0 && !error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
                  <p className="max-w-md text-base leading-relaxed text-gray-600">
                    Nenhum produto encontrado nesta subcategoria.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubFilter("")}
                    className="text-sm font-bold text-regif-blue underline-offset-4 hover:underline"
                  >
                    Ver todas as subcategorias
                  </button>
                </div>
              ) : products.length === 0 ? (
                <p className="py-16 text-center text-gray-500">Não foi possível carregar os produtos.</p>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 disabled:opacity-40"
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
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 disabled:opacity-40"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          )
        ) : null}
      </div>
    </div>
  );
}
