import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import clsx from "clsx";

import {
  orderStatusBadgePt,
  paymentStatusBadgePt,
} from "../../features/shop/shopOrderLabels";
import {
  listShopGuestOrders,
  requestShopGuestOrderCode,
  verifyShopGuestOrderCode,
  type ShopGuestOrder,
  type ShopGuestOrderStatusLog,
} from "../../services/shopService";
import {
  clearShopGuestOrdersToken,
  getShopGuestOrdersToken,
  setShopGuestOrdersToken,
} from "../../lib/shopGuestApi";
import { toApiError } from "../../shared/api/contracts";

function formatBrlDecimal(s: string) {
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function Timeline({ logs }: { logs: ShopGuestOrderStatusLog[] }) {
  if (!logs.length) return null;
  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h3 className="text-base font-black text-regif-dark">Andamento do pedido</h3>
      <p className="mt-1 text-xs text-gray-500">
        Atualizado pela equipe da REGIF. Os status aparecem em português e com cores para facilitar a leitura.
      </p>
      <div className="relative mt-5 pl-2">
        <span
          className="absolute bottom-2 left-[10px] top-2 w-px bg-gradient-to-b from-regif-green/50 via-regif-blue/25 to-transparent"
          aria-hidden
        />
        <ol className="relative space-y-4">
        {logs.map((log) => {
          const ob = orderStatusBadgePt(log.toOrderStatus);
          const pb = log.toPaymentStatus ? paymentStatusBadgePt(log.toPaymentStatus) : null;
          return (
            <li key={log.id} className="relative flex gap-4">
              <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full bg-regif-green shadow-sm ring-4 ring-white" />
              <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 shadow-sm ring-1 ring-black/[0.02]">
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
                <div className="mt-2 text-xs font-medium text-gray-500">
                  {new Date(log.createdAt).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
                {log.note ? <p className="mt-2 text-sm text-gray-700">{log.note}</p> : null}
              </div>
            </li>
          );
        })}
        </ol>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: ShopGuestOrder }) {
  const [open, setOpen] = useState(false);
  const mainStatus = orderStatusBadgePt(order.status);
  const payBadge = paymentStatusBadgePt(order.paymentStatus);
  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 ring-1 ring-black/[0.04] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-regif-green">Pedido</p>
          <p className="mt-1 font-mono text-xl font-black text-regif-dark">{order.publicNumber}</p>
          <p className="mt-2 text-lg font-black tabular-nums text-regif-green">{formatBrlDecimal(order.grandTotal)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <span className={clsx("inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide", mainStatus.className)}>
            {mainStatus.label}
          </span>
          <span className={clsx("inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide", payBadge.className)}>
            {payBadge.label}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-5 rounded-xl bg-regif-blue/10 px-4 py-2 text-sm font-black text-regif-blue transition hover:bg-regif-blue/15"
      >
        {open ? "Ocultar detalhes" : "Ver detalhes do pedido"}
      </button>
      {open ? (
        <div className="mt-6 space-y-6 text-sm text-gray-700">
          <div>
            <h3 className="text-base font-black text-regif-dark">Itens</h3>
            <ul className="mt-3 space-y-3">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3 ring-1 ring-black/[0.02]">
                  {it.imageUrlSnapshot ? (
                    <img
                      src={it.imageUrlSnapshot}
                      alt={it.productTitleSnapshot}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-gray-100"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-[10px] font-bold text-gray-500">
                      Sem foto
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">{it.productTitleSnapshot}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {it.quantity} × {formatBrlDecimal(it.unitPriceSnapshot)} ={" "}
                      <span className="font-semibold text-gray-800">{formatBrlDecimal(it.lineSubtotalSnapshot)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Pagamento</h3>
              <span className={clsx("mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide", payBadge.className)}>
                {payBadge.label}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Resumo</h3>
              <p className="mt-2 text-gray-600">
                Subtotal: <span className="font-semibold text-gray-900">{formatBrlDecimal(order.subtotal)}</span>
              </p>
              <p className="text-gray-600">
                Frete: <span className="font-semibold text-gray-900">{formatBrlDecimal(order.shippingTotal)}</span>
              </p>
              <p className="mt-2 text-base font-black text-regif-green">
                Total: {formatBrlDecimal(order.grandTotal)}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-regif-dark">Entrega</h3>
            <p className="mt-1 whitespace-pre-line">
              {[order.shippingRecipientName, order.shippingLine1, order.shippingLine2, order.shippingNeighborhood]
                .filter(Boolean)
                .join("\n")}
              {"\n"}
              {[order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join(" · ")}
            </p>
          </div>
          {order.customerNote ? (
            <div>
              <h3 className="font-bold text-regif-dark">Observação sua</h3>
              <p className="mt-1 text-gray-600">{order.customerNote}</p>
            </div>
          ) : null}
          <Timeline logs={order.statusLogs} />
        </div>
      ) : null}
    </article>
  );
}

type Step = "email" | "code" | "list";

export function ShopGuestOrdersPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<ShopGuestOrder[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const items = await listShopGuestOrders();
    setOrders(items);
    setStep("list");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = getShopGuestOrdersToken();
    if (!t) {
      setLoadingSession(false);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        await loadOrders();
      } catch {
        clearShopGuestOrdersToken();
        if (!cancelled) setStep("email");
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  const onRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await requestShopGuestOrderCode(email.trim());
      setError(null);
      setInfo(res.message ?? null);
      if (res.codeSent) {
        setStep("code");
        setCode("");
      }
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token } = await verifyShopGuestOrderCode({
        email: email.trim(),
        code: code.replace(/\D/g, ""),
      });
      setShopGuestOrdersToken(token);
      await loadOrders();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const onLogout = () => {
    clearShopGuestOrdersToken();
    setOrders([]);
    setStep("email");
    setCode("");
    setError(null);
  };

  if (loadingSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-white py-24 text-regif-dark">
        <Loader2 className="h-8 w-8 animate-spin text-regif-blue" />
        <p className="text-sm font-semibold">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50/90 pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 pb-2 pt-6">
        <Link
          to="/loja"
          className="inline-flex items-center gap-1 text-sm font-bold text-regif-blue hover:underline"
        >
          ← Voltar à lojinha
        </Link>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-regif-green">Lojinha REGIF</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-regif-dark md:text-4xl">Meus pedidos</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
            Acompanhe pedidos feitos com o mesmo e-mail da compra. O código enviado vale uma única vez.
          </p>
        </div>

        {step === "list" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-md ring-1 ring-black/[0.04]">
              <p className="text-sm text-gray-600">
                Pedidos do e-mail <span className="font-bold text-regif-dark">{orders[0]?.customerEmail ?? email}</span>
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-gray-200 bg-white/90 p-10 text-center text-sm font-medium text-gray-600 shadow-inner">
                Nenhum pedido encontrado para este acesso.
              </p>
            ) : (
              orders.map((o) => <OrderCard key={o.id} order={o} />)
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg ring-1 ring-black/[0.04]">
            {step === "email" ? (
              <form onSubmit={onRequestCode} className="space-y-4">
                {info ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">{info}</p>
                ) : null}
                <label className="block text-sm font-semibold text-gray-700">
                  E-mail usado na compra
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-regif-blue/30"
                    placeholder="voce@exemplo.com"
                  />
                </label>
                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-regif-blue py-3 text-sm font-bold text-white transition hover:bg-regif-blue/90 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Enviar código
                </button>
              </form>
            ) : (
              <form onSubmit={onVerify} className="space-y-4">
                {info ? (
                  <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{info}</p>
                ) : null}
                <p className="text-sm text-gray-600">
                  Enviamos um código de 6 dígitos para <strong>{email.trim()}</strong>. Digite-o abaixo.
                </p>
                <label className="block text-sm font-semibold text-gray-700">
                  Código
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-regif-blue/30"
                    placeholder="000000"
                  />
                </label>
                {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                      setInfo(null);
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Alterar e-mail
                  </button>
                  <button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-regif-green py-3 text-sm font-bold text-regif-dark transition hover:bg-green-400 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    Entrar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
