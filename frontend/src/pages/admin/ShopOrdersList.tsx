import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Loader2,
  RefreshCcw,
  Search,
  ServerCrash,
  ShoppingBag,
} from "lucide-react";
import clsx from "clsx";

import {
  orderStatusBadgePt,
  paymentStatusBadgePt,
} from "../../features/shop/shopOrderLabels";
import { listAdminShopOrders, type ShopOrderStatus } from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";
import { rangeText } from "../../services/adminUserService";
import { NewsListPagination } from "../../features/news/components/admin/NewsListPagination";

type OrderRow = {
  id: string;
  publicNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items?: Array<{ id?: string }>;
};

function formatBrlDecimal(s: string) {
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return s;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  embedded?: boolean;
};

const PAGE_SIZE = 20;

export function ShopOrdersList({ embedded }: Props) {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ShopOrderStatus>("");
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
    setLoading(true);
    (async () => {
      try {
        const res = await listAdminShopOrders({
          page,
          pageSize: PAGE_SIZE,
          q: q.trim() || undefined,
          status: status || undefined,
        });
        if (cancelled) return;
        setItems(res.items as OrderRow[]);
        if (res.meta) {
          setMeta({
            page: res.meta.page,
            pageSize: res.meta.pageSize ?? PAGE_SIZE,
            total: res.meta.total ?? 0,
            totalPages: res.meta.totalPages,
          });
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, q, status]);

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  const rootClass = embedded ? "space-y-8" : "mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8";

  async function refetch() {
    setLoading(true);
    try {
      const res = await listAdminShopOrders({
        page,
        pageSize: PAGE_SIZE,
        q: q.trim() || undefined,
        status: status || undefined,
      });
      setItems(res.items as OrderRow[]);
      if (res.meta) {
        setMeta({
          page: res.meta.page,
          pageSize: res.meta.pageSize ?? PAGE_SIZE,
          total: res.meta.total ?? 0,
          totalPages: res.meta.totalPages,
        });
      }
      setError(null);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={clsx(rootClass, !embedded && "min-h-full bg-gradient-to-b from-gray-50 via-white to-gray-50/90 pb-16")}>
      {!embedded && (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-regif-green">Lojinha</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-regif-dark">Pedidos</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Lista detalhada com status em português e cores para leitura rápida. Clique em uma linha para abrir o pedido.
            </p>
          </div>
          <Link
            to="/admin/shop"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-regif-blue shadow-sm transition hover:bg-gray-50"
          >
            Voltar à lojinha
          </Link>
        </header>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/50 ring-1 ring-black/[0.04] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, e-mail ou nome…"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void refetch();
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="min-w-[220px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-bold text-gray-800 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "" | ShopOrderStatus);
                setPage(1);
              }}
              aria-label="Filtrar por status do pedido"
            >
              <option value="">Todos os status</option>
              <option value="AWAITING_PAYMENT">Aguardando pagamento</option>
              <option value="PAYMENT_RECEIVED">Pagamento recebido</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PROCESSING">Em separação</option>
              <option value="READY_FOR_PICKUP">Pronto para retirada</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
            </select>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-regif-blue px-5 py-3.5 text-sm font-black text-white shadow-md shadow-regif-blue/20 transition hover:bg-regif-blue/90"
              title="Atualizar lista"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-600">{rangeText(meta)}</div>
        {loading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-regif-blue">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm ring-1 ring-red-100">
          <div className="flex items-start gap-4">
            <ServerCrash className="mt-0.5 h-8 w-8 shrink-0 text-red-600" />
            <div>
              <p className="font-black">Não foi possível carregar os pedidos</p>
              <p className="mt-1 text-sm opacity-90">{error}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !error ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-gray-100 bg-white shadow-inner">
          <Loader2 className="h-10 w-10 animate-spin text-regif-blue" />
          <p className="text-sm font-semibold text-gray-600">Carregando pedidos…</p>
        </div>
      ) : !error && items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-300" strokeWidth={1.25} />
          <p className="text-lg font-bold text-gray-800">Nenhum pedido encontrado</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Ajuste os filtros ou aguarde novos pedidos na lojinha.</p>
        </div>
      ) : !error ? (
        <>
          <div className="rounded-3xl border border-gray-100 bg-white shadow-lg shadow-gray-200/40 ring-1 ring-black/[0.04] md:overflow-hidden">
            <div className="divide-y divide-gray-100 md:hidden">
              {items.map((o) => {
                const os = orderStatusBadgePt(o.status);
                const pay = paymentStatusBadgePt(o.paymentStatus);
                const nItems = o.items?.length ?? 0;
                return (
                  <div key={o.id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-regif-blue">{o.publicNumber}</p>
                        <p className="mt-1 truncate text-base font-black text-gray-900">{o.customerName}</p>
                        <p className="truncate text-xs text-gray-500">{o.customerEmail}</p>
                      </div>
                      <span
                        className={clsx(
                          "inline-block max-w-[min(100%,14rem)] whitespace-normal break-words rounded-xl px-2.5 py-1.5 text-center text-[10px] font-black uppercase leading-snug tracking-normal",
                          os.className
                        )}
                      >
                        {os.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={clsx(
                          "inline-block max-w-[min(100%,14rem)] whitespace-normal break-words rounded-xl px-2.5 py-1.5 text-center text-[10px] font-black uppercase leading-snug tracking-normal",
                          pay.className
                        )}
                      >
                        {pay.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-700 ring-1 ring-gray-200/80">
                        {nItems} {nItems === 1 ? "item" : "itens"}
                      </span>
                      <span className="font-black tabular-nums text-regif-green">{formatBrlDecimal(o.grandTotal)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{formatOrderDate(o.createdAt)}</p>
                    <Link
                      to={`/admin/shop/orders/${o.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 py-3 text-sm font-black text-regif-blue transition hover:border-regif-blue/30 hover:bg-white"
                    >
                      Ver pedido completo
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[23%]" />
                  <col className="w-[7%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50/80">
                    <th className="px-3 py-4 text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Pedido
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Data
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Cliente
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Itens
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Status
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Pagamento
                    </th>
                    <th className="px-3 py-4 text-right text-xs font-black uppercase leading-tight tracking-wider text-gray-500 lg:px-4">
                      Total
                    </th>
                    <th className="px-2 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-500">
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((o) => {
                    const os = orderStatusBadgePt(o.status);
                    const pay = paymentStatusBadgePt(o.paymentStatus);
                    const nItems = o.items?.length ?? 0;
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-regif-blue/[0.04]">
                        <td className="px-3 py-4 align-top lg:px-4">
                          <span className="break-words font-mono text-[11px] font-black leading-snug text-regif-blue">
                            {o.publicNumber}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-top text-xs leading-snug text-gray-600 lg:px-4">
                          {formatOrderDate(o.createdAt)}
                        </td>
                        <td className="px-3 py-4 align-top lg:px-4">
                          <div className="break-words font-bold leading-snug text-gray-900">{o.customerName}</div>
                          <div className="mt-0.5 break-words text-xs leading-snug text-gray-500">{o.customerEmail}</div>
                        </td>
                        <td className="px-3 py-4 align-top text-center lg:px-4">
                          <span className="inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-full bg-teal-50 px-2 py-1 text-xs font-black tabular-nums text-teal-900 ring-1 ring-teal-200/70">
                            {nItems}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-top lg:px-4">
                          <span
                            className={clsx(
                              "inline-block w-full whitespace-normal break-words rounded-xl px-2 py-1.5 text-center text-[10px] font-black uppercase leading-snug tracking-normal lg:text-[11px]",
                              os.className
                            )}
                          >
                            {os.label}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-top lg:px-4">
                          <span
                            className={clsx(
                              "inline-block w-full whitespace-normal break-words rounded-xl px-2 py-1.5 text-center text-[10px] font-black uppercase leading-snug tracking-normal lg:text-[11px]",
                              pay.className
                            )}
                          >
                            {pay.label}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-top text-right text-sm font-black tabular-nums leading-snug text-regif-green lg:px-4 lg:text-base">
                          {formatBrlDecimal(o.grandTotal)}
                        </td>
                        <td className="px-2 py-4 align-top text-right">
                          <Link
                            to={`/admin/shop/orders/${o.id}`}
                            title="Abrir pedido"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-regif-blue shadow-sm transition hover:border-regif-blue/40 hover:bg-regif-blue/5 lg:h-10 lg:w-10"
                          >
                            <ChevronRight size={18} strokeWidth={2.5} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
      ) : null}
    </div>
  );
}
