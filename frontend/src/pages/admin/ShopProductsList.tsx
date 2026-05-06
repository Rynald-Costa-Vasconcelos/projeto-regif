import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import clsx from "clsx";

import {
  deleteAdminShopProduct,
  listAdminShopCategories,
  listAdminShopProducts,
  updateAdminShopProduct,
  type ShopAdminProduct,
  type ShopProductStatus,
  type ShopPublicCategory,
} from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";
import { rangeText } from "../../services/adminUserService";
import { NewsListPagination } from "../../features/news/components/admin/NewsListPagination";

function formatBrl(value: string | undefined) {
  if (value == null) return "—";
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
    : "—";
}

function productThumbUrl(p: ShopAdminProduct): string | null {
  const imgs = p.images ?? [];
  const primary = imgs.find((i) => i.isPrimary);
  const img = primary ?? imgs[0];
  if (!img) return null;
  return img.thumbUrl || img.url || null;
}

function ShopProductStatusBadge({ status }: { status: ShopProductStatus }) {
  const map: Record<ShopProductStatus, { label: string; cls: string }> = {
    PUBLISHED: { label: "Publicado", cls: "bg-green-100 text-green-700" },
    DRAFT: { label: "Rascunho", cls: "bg-amber-100 text-amber-700" },
    ARCHIVED: { label: "Arquivado", cls: "bg-slate-100 text-slate-600" },
  };
  const item = map[status] ?? map.DRAFT;
  return (
    <span className={clsx("px-3 py-1 rounded-full text-xs font-bold shrink-0", item.cls)}>{item.label}</span>
  );
}

function ShopProductCardStockEditor({
  productId,
  stockQuantity,
  disabled,
  onSaved,
  onSavingChange,
}: {
  productId: string;
  stockQuantity: number;
  disabled: boolean;
  onSaved: (updated: ShopAdminProduct) => void;
  onSavingChange?: (saving: boolean) => void;
}) {
  const [draft, setDraft] = useState(String(stockQuantity));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(String(stockQuantity));
  }, [stockQuantity, productId]);

  const busy = disabled || saving;

  async function persist(next: number) {
    const q = Math.max(0, Math.floor(next));
    if (q === stockQuantity) {
      setDraft(String(q));
      return;
    }
    setSaving(true);
    onSavingChange?.(true);
    try {
      const updated = await updateAdminShopProduct(productId, { stockQuantity: q });
      onSaved(updated);
      setDraft(String(updated.stockQuantity ?? q));
    } catch (e) {
      alert(toApiError(e).message);
      setDraft(String(stockQuantity));
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <div className="flex w-full h-10 items-stretch rounded-lg border border-gray-200 bg-white text-sm shadow-sm overflow-hidden">
      <button
        type="button"
        title="Diminuir estoque"
        disabled={busy || stockQuantity <= 0}
        onClick={() => void persist(stockQuantity - 1)}
        className="w-9 shrink-0 inline-flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <Minus size={16} strokeWidth={2.25} />
      </button>
      <label className="sr-only" htmlFor={`stock-${productId}`}>
        Quantidade em estoque
      </label>
      <input
        id={`stock-${productId}`}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        disabled={busy}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const raw = draft.trim();
          const n = raw === "" ? stockQuantity : Math.floor(Number(raw.replace(",", ".")));
          if (!Number.isFinite(n) || n < 0) {
            setDraft(String(stockQuantity));
            return;
          }
          void persist(n);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="min-w-0 flex-1 border-x border-gray-200 px-1 text-center text-sm font-bold tabular-nums text-gray-900 bg-gray-50/70 focus:outline-none focus:bg-white focus:z-[1] focus:ring-2 focus:ring-inset focus:ring-regif-blue/25 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        title="Aumentar estoque"
        disabled={busy}
        onClick={() => void persist(stockQuantity + 1)}
        className="w-9 shrink-0 inline-flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <Plus size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}

type Props = {
  embedded?: boolean;
};

const PAGE_SIZE = 20;

export function ShopProductsList({ embedded }: Props) {
  const [items, setItems] = useState<ShopAdminProduct[]>([]);
  const [categories, setCategories] = useState<ShopPublicCategory[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ShopProductStatus>("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingStatusId, setSettingStatusId] = useState<string | null>(null);
  const [stockSavingId, setStockSavingId] = useState<string | null>(null);
  const searchDebounceIsFirst = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(searchDraft);
      if (!searchDebounceIsFirst.current) setPage(1);
      searchDebounceIsFirst.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listAdminShopCategories();
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminShopProducts({
        page,
        pageSize: PAGE_SIZE,
        q: q.trim() || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
      });
      setItems(res.items);
      if (res.meta) setMeta(res.meta);
      setError(null);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, [page, q, status, categoryId]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  async function onDelete(p: ShopAdminProduct) {
    if (
      !window.confirm(
        `Excluir o produto "${p.title}"?\n\nSe já existir em pedidos, ele será arquivado em vez de ser apagado.`
      )
    ) {
      return;
    }
    setDeletingId(p.id);
    try {
      const result = await deleteAdminShopProduct(p.id);
      if (result.archived) {
        alert("Este produto já consta em pedidos: foi arquivado em vez de excluído.");
      }
      await fetchList();
    } catch (e) {
      alert(toApiError(e).message);
    } finally {
      setDeletingId(null);
    }
  }

  async function changeStatus(id: string, next: ShopProductStatus) {
    setSettingStatusId(id);
    try {
      const updated = await updateAdminShopProduct(id, { status: next });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
    } catch (e) {
      alert(toApiError(e).message);
    } finally {
      setSettingStatusId(null);
    }
  }

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;
  const busy = (id: string) => deletingId === id || settingStatusId === id || stockSavingId === id;

  const rootClass = embedded ? "space-y-6" : "p-6 md:p-8 max-w-6xl mx-auto space-y-6";

  return (
    <div className={rootClass}>
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-regif-dark">Produtos</h1>
            <p className="text-gray-500 text-sm">Listagem administrativa do catálogo.</p>
          </div>
          <Link
            to="/admin/shop/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-regif-blue text-white px-4 py-2.5 font-bold text-sm shadow hover:bg-blue-800 transition"
          >
            <Plus size={18} /> Novo produto
          </Link>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por título ou slug…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchList();
              }}
            />
          </div>

          <div className="grid grid-cols-2 xl:flex gap-3">
            <select
              className="px-3 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 text-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ShopProductStatus | "");
                setPage(1);
              }}
              aria-label="Filtrar por status"
            >
              <option value="">Todos os status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>

            <button
              type="button"
              onClick={() => void fetchList()}
              className="col-span-2 xl:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-regif-blue hover:bg-blue-50 rounded-xl transition"
              title="Atualizar"
            >
              <RefreshCcw size={18} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">{rangeText(meta)}</div>
        {loading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-regif-blue" />
            Carregando…
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border">
          <Loader2 className="animate-spin text-regif-blue" size={40} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">Nenhum produto encontrado.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((p) => {
              const thumb = productThumbUrl(p);
              const catName = p.category?.name ?? "Sem categoria";
              const publicHref = p.status === "PUBLISHED" ? `/loja/produto/${encodeURIComponent(p.slug)}` : null;

              return (
                <article
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col hover:border-regif-blue/25 transition-colors"
                >
                  <div className="relative aspect-[4/3] bg-gray-100 shrink-0">
                    {thumb ? (
                      <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageOff size={36} strokeWidth={1.25} />
                        <span className="text-xs font-semibold">Sem foto</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      {p.status === "PUBLISHED" && p.stockQuantity <= 0 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold shrink-0 bg-rose-100 text-rose-800 border border-rose-200/80">
                          Esgotado
                        </span>
                      ) : (
                        <ShopProductStatusBadge status={p.status} />
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 gap-4 min-w-0">
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 tracking-tight">
                        {p.title}
                      </h3>
                      <p className="text-[10px] text-regif-blue font-bold uppercase tracking-wide truncate">
                        {catName}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Preço</span>
                          <div className="flex h-10 items-center justify-center rounded-lg border border-gray-200/90 bg-white px-2 text-sm font-bold tabular-nums text-gray-900 shadow-sm">
                            {formatBrl(p.price)}
                          </div>
                        </div>
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Estoque</span>
                          <ShopProductCardStockEditor
                            productId={p.id}
                            stockQuantity={p.stockQuantity}
                            disabled={busy(p.id)}
                            onSaved={(updated) =>
                              setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)))
                            }
                            onSavingChange={(saving) => {
                              setStockSavingId((cur) => {
                                if (saving) return p.id;
                                return cur === p.id ? null : cur;
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        "grid w-full gap-1.5 mt-auto pt-1 border-t border-gray-100",
                        p.status === "ARCHIVED" ? "grid-cols-4" : "grid-cols-5"
                      )}
                    >
                      <div className="min-w-0">
                        {publicHref ? (
                          <a
                            href={publicHref}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver na loja"
                            className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-regif-blue hover:bg-blue-50 hover:border-blue-200 transition"
                          >
                            <ExternalLink size={17} strokeWidth={2} />
                          </a>
                        ) : (
                          <span
                            className="flex h-10 w-full items-center justify-center rounded-lg border border-dashed border-gray-200/80 bg-gray-50/50 text-gray-300"
                            title="Disponível após publicar"
                          >
                            <ExternalLink size={17} strokeWidth={2} className="opacity-40" />
                          </span>
                        )}
                      </div>

                      {p.status !== "ARCHIVED" ? (
                        <div className="min-w-0">
                          <button
                            type="button"
                            disabled={busy(p.id)}
                            onClick={() =>
                              void changeStatus(p.id, p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")
                            }
                            title={p.status === "PUBLISHED" ? "Voltar para rascunho" : "Publicar"}
                            className={clsx(
                              "flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white transition disabled:opacity-40",
                              p.status === "PUBLISHED"
                                ? "text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                                : "text-regif-blue hover:bg-blue-50 hover:border-blue-200"
                            )}
                          >
                            {p.status === "PUBLISHED" ? (
                              <EyeOff size={17} strokeWidth={2} />
                            ) : (
                              <Eye size={17} strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      ) : null}

                      <div className="min-w-0">
                        {p.status === "ARCHIVED" ? (
                          <button
                            type="button"
                            disabled={busy(p.id)}
                            onClick={() => void changeStatus(p.id, "DRAFT")}
                            title="Desarquivar (volta como rascunho)"
                            className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-regif-blue hover:bg-blue-50 hover:border-blue-200 transition disabled:opacity-40"
                          >
                            <ArchiveRestore size={17} strokeWidth={2} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy(p.id)}
                            onClick={() => void changeStatus(p.id, "ARCHIVED")}
                            title="Arquivar"
                            className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition disabled:opacity-40"
                          >
                            <Archive size={17} strokeWidth={2} />
                          </button>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={`/admin/shop/products/${p.id}`}
                          title="Editar"
                          className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-regif-green hover:bg-green-50 hover:border-green-200 transition"
                        >
                          <Edit3 size={17} strokeWidth={2} />
                        </Link>
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          disabled={busy(p.id)}
                          onClick={() => void onDelete(p)}
                          title="Excluir"
                          className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-regif-red hover:bg-red-50 hover:border-red-200 transition disabled:opacity-40"
                        >
                          <Trash2 size={17} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <NewsListPagination
            page={meta.page}
            totalPages={meta.totalPages}
            canPrev={canPrev}
            canNext={canNext}
            loading={loading}
            onPrev={() => setPage((x) => Math.max(1, x - 1))}
            onNext={() => setPage((x) => Math.min(meta.totalPages, x + 1))}
          />
        </>
      )}
    </div>
  );
}
