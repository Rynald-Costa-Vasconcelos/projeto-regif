import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  MapPin,
  Package,
  ScrollText,
  User,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import {
  ORDER_STATUS_LABELS_PT,
  PAYMENT_STATUS_LABELS_PT,
  orderStatusBadgePt,
  paymentMethodLabelPt,
  paymentStatusBadgePt,
} from "../../features/shop/shopOrderLabels";
import {
  getAdminShopOrder,
  updateAdminShopOrderStatus,
  type ShopOrderStatus,
  type ShopPaymentStatus,
} from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

function formatBrl(s: string | number | undefined) {
  if (s === undefined) return "—";
  const n = typeof s === "number" ? s : Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return String(s);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const CARD =
  "rounded-3xl border border-gray-100 bg-white p-6 shadow-md shadow-gray-200/40 ring-1 ring-black/[0.03] md:p-8";

export function ShopOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nextStatus, setNextStatus] = useState("");
  const [nextPayment, setNextPayment] = useState("");
  const [baselineStatus, setBaselineStatus] = useState("");
  const [baselinePayment, setBaselinePayment] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const o = await getAdminShopOrder(id);
      setOrder(o);
      const st = String(o.status ?? "");
      const pay = String(o.paymentStatus ?? "");
      setNextStatus(st);
      setNextPayment(pay);
      setBaselineStatus(st);
      setBaselinePayment(pay);
      setError(null);
    } catch (e) {
      setError(toApiError(e).message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const patch: {
        status?: ShopOrderStatus;
        paymentStatus?: ShopPaymentStatus;
        note?: string | null;
      } = {};
      if (nextStatus && nextStatus !== baselineStatus) patch.status = nextStatus as ShopOrderStatus;
      if (nextPayment && nextPayment !== baselinePayment) {
        patch.paymentStatus = nextPayment as ShopPaymentStatus;
      }
      if (note.trim()) patch.note = note.trim();
      if (Object.keys(patch).length === 0) {
        setError("Escolha um novo status ou pagamento, ou escreva uma nota para registrar.");
        setSaving(false);
        return;
      }
      await updateAdminShopOrderStatus(id, patch);
      setNote("");
      await load();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-white py-24">
        <Loader2 className="h-10 w-10 animate-spin text-regif-blue" />
        <p className="text-sm font-semibold text-gray-600">Carregando pedido…</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-8 text-center">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 ring-1 ring-red-100">{error}</p>
        <Link
          to="/admin/shop?tab=orders"
          className="inline-flex items-center gap-2 font-bold text-regif-blue hover:underline"
        >
          <ChevronLeft size={18} />
          Voltar aos pedidos
        </Link>
      </div>
    );
  }

  const items = (order?.items as Array<Record<string, unknown>>) ?? [];
  const logs = (order?.statusLogs as Array<Record<string, unknown>>) ?? [];
  const orderStatus = String(order?.status ?? "");
  const payStatus = String(order?.paymentStatus ?? "");
  const payMethod = String(order?.paymentMethod ?? "UNKNOWN");
  const osBadge = orderStatusBadgePt(orderStatus);
  const payBadge = paymentStatusBadgePt(payStatus);

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 via-white to-gray-50/80 pb-16">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/admin/shop?tab=orders"
              className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-regif-blue hover:underline"
            >
              <ChevronLeft size={18} />
              Pedidos
            </Link>
            <p className="text-xs font-bold uppercase tracking-widest text-regif-green">Pedido</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-regif-dark md:text-4xl">
              {String(order?.publicNumber)}
            </h1>
            <p className="mt-2 font-mono text-xs text-gray-400">ID interno · {String(order?.id)}</p>
            <p className="mt-2 text-sm text-gray-500">
              Criado em{" "}
              <span className="font-semibold text-gray-700">
                {order?.createdAt
                  ? new Date(String(order.createdAt)).toLocaleString("pt-BR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })
                  : "—"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide", osBadge.className)}>
              {osBadge.label}
            </span>
            <span className={clsx("inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide", payBadge.className)}>
              {payBadge.label}
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={CARD} aria-labelledby="cliente-heading">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-regif-blue/10 text-regif-blue">
                <User size={22} strokeWidth={2} />
              </span>
              <div>
                <h2 id="cliente-heading" className="text-lg font-black text-regif-dark">
                  Cliente
                </h2>
                <p className="text-xs text-gray-500">Dados informados no checkout</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">Nome</dt>
                <dd className="mt-1 font-semibold text-gray-900">{String(order?.customerName ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">E-mail</dt>
                <dd className="mt-1 font-medium text-regif-blue">{String(order?.customerEmail ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">Telefone</dt>
                <dd className="mt-1 text-gray-800">{order?.customerPhone ? String(order.customerPhone) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">Documento</dt>
                <dd className="mt-1 text-gray-800">{order?.customerDocument ? String(order.customerDocument) : "—"}</dd>
              </div>
            </dl>
          </section>

          <section className={CARD} aria-labelledby="pagamento-heading">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Wallet size={22} strokeWidth={2} />
              </span>
              <div>
                <h2 id="pagamento-heading" className="text-lg font-black text-regif-dark">
                  Pagamento e totais
                </h2>
                <p className="text-xs text-gray-500">Valores exibidos ao cliente</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-gray-50 py-2">
                <dt className="text-gray-500">Meio de pagamento</dt>
                <dd className="font-semibold text-gray-900">{paymentMethodLabelPt(payMethod)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatBrl(order?.subtotal as string)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-gray-500">Frete</dt>
                <dd className="font-semibold tabular-nums">{formatBrl(order?.shippingTotal as string)}</dd>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl bg-gradient-to-r from-regif-green/15 to-emerald-50 px-4 py-3">
                <dt className="font-black text-regif-dark">Total</dt>
                <dd className="text-xl font-black tabular-nums text-regif-green">{formatBrl(order?.grandTotal as string)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className={CARD} aria-labelledby="entrega-heading">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <MapPin size={22} strokeWidth={2} />
            </span>
            <div>
              <h2 id="entrega-heading" className="text-lg font-black text-regif-dark">
                Entrega
              </h2>
              <p className="text-xs text-gray-500">Endereço de envio</p>
            </div>
          </div>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-800">
            {[
              order?.shippingRecipientName,
              order?.shippingLine1,
              order?.shippingLine2,
              order?.shippingNeighborhood,
            ]
              .filter(Boolean)
              .map(String)
              .join("\n")}
            {"\n"}
            {[order?.shippingCity, order?.shippingState, order?.shippingPostalCode].filter(Boolean).map(String).join(" · ")}
            {order?.shippingCountry ? `\n${String(order.shippingCountry)}` : ""}
          </p>
          {order?.customerNote ? (
            <div className="mt-6 rounded-2xl bg-blue-50/80 px-4 py-3 ring-1 ring-blue-100">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Observação do cliente</p>
              <p className="mt-1 text-sm text-blue-950">{String(order.customerNote)}</p>
            </div>
          ) : null}
        </section>

        <section className={CARD} aria-labelledby="itens-heading">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
              <Package size={22} strokeWidth={2} />
            </span>
            <div>
              <h2 id="itens-heading" className="text-lg font-black text-regif-dark">
                Itens ({items.length})
              </h2>
              <p className="text-xs text-gray-500">Preços congelados no momento da compra</p>
            </div>
          </div>
          <ul className="mt-5 space-y-4">
            {items.map((it) => {
              const thumb = it.imageUrlSnapshot ? String(it.imageUrlSnapshot) : null;
              return (
                <li
                  key={String(it.id)}
                  className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 ring-1 ring-black/[0.02]"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                    {thumb ? (
                      <img src={thumb} alt={String(it.productTitleSnapshot)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold text-gray-400">Sem foto</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">{String(it.productTitleSnapshot)}</p>
                    {it.variantNameSnapshot ? (
                      <p className="text-xs text-gray-500">{String(it.variantNameSnapshot)}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold tabular-nums">{formatBrl(String(it.unitPriceSnapshot))}</span>
                      <span className="text-gray-400"> × </span>
                      <span className="font-bold">{String(it.quantity)}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold uppercase text-gray-400">Subtotal</p>
                    <p className="text-lg font-black tabular-nums text-regif-dark">{formatBrl(String(it.lineSubtotalSnapshot))}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {logs.length > 0 ? (
          <section className={CARD} aria-labelledby="historico-heading">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ScrollText size={22} strokeWidth={2} />
              </span>
              <div>
                <h2 id="historico-heading" className="text-lg font-black text-regif-dark">
                  Histórico no painel
                </h2>
                <p className="text-xs text-gray-500">Registro de mudanças de status e pagamento</p>
              </div>
            </div>
            <ol className="mt-6 space-y-4">
              {logs.map((log) => {
                const toS = String(log.toOrderStatus ?? "");
                const toP = log.toPaymentStatus ? String(log.toPaymentStatus) : "";
                const ob = orderStatusBadgePt(toS);
                const pb = toP ? paymentStatusBadgePt(toP) : null;
                const actor = log.createdBy as { name?: string } | null | undefined;
                return (
                  <li key={String(log.id)} className="relative flex gap-4 pl-2">
                    <span className="absolute left-0 top-2 h-full w-px bg-gradient-to-b from-regif-blue/30 to-transparent" aria-hidden />
                    <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full bg-regif-blue shadow-sm ring-4 ring-white" />
                    <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={clsx("rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide", ob.className)}>
                          {ob.label}
                        </span>
                        {pb ? (
                          <span className={clsx("rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide", pb.className)}>
                            {pb.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(String(log.createdAt)).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        {actor?.name ? (
                          <span className="font-semibold text-gray-600"> · por {actor.name}</span>
                        ) : null}
                      </p>
                      {log.note ? <p className="mt-2 text-sm text-gray-700">{String(log.note)}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {order?.internalNote ? (
          <section className={clsx(CARD, "border-amber-200/80 bg-amber-50/40")} aria-labelledby="interno-heading">
            <h2 id="interno-heading" className="text-lg font-black text-amber-950">
              Nota interna
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950/90">{String(order.internalNote)}</p>
          </section>
        ) : null}

        <form onSubmit={onSubmit} className={clsx(CARD, "border-regif-blue/15 bg-gradient-to-br from-white to-regif-blue/[0.03]")}>
          <h2 className="text-lg font-black text-regif-dark">Atualizar pedido</h2>
          <p className="mt-1 text-sm text-gray-600">Altere status ou pagamento e registre uma nota visível no histórico.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-gray-800">
              Status do pedido
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-regif-blue focus:ring-4 focus:ring-regif-blue/15"
              >
                {Object.entries(ORDER_STATUS_LABELS_PT).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Status do pagamento
              <select
                value={nextPayment}
                onChange={(e) => setNextPayment(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-regif-blue focus:ring-4 focus:ring-regif-blue/15"
              >
                {Object.entries(PAYMENT_STATUS_LABELS_PT).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-5 block text-sm font-bold text-gray-800">
            Nota desta alteração (opcional)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ex.: PIX confirmado pelo financeiro; envio pelos Correios…"
              className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-regif-blue focus:ring-4 focus:ring-regif-blue/15"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-regif-blue px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-regif-blue/20 transition hover:bg-regif-blue/90 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Registrar alteração
          </button>
        </form>
      </div>
    </div>
  );
}
