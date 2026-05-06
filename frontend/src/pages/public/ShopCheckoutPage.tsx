import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, Loader2, ShoppingBag } from "lucide-react";
import clsx from "clsx";

import { ShopCartLines } from "../../features/shop/ShopCartLines";
import { maskBrazilPhoneInput, phoneDigitsOnly } from "../../features/shop/formatBrazilPhone";
import { useShopCart } from "../../features/shop/ShopCartContext";
import { createPublicShopOrder } from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

function formatBrl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

type Phase = "cart" | "checkout";

export function ShopCheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, setQty, removeLine, clear } = useShopCart();
  const [phase, setPhase] = useState<Phase>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerEmail, setCustomerEmail] = useState("");
  const [customerEmailConfirm, setCustomerEmailConfirm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const shippingTotal = 0;
  const discountTotal = 0;
  const taxTotal = 0;
  const grandTotal = useMemo(() => subtotal + shippingTotal + taxTotal - discountTotal, [subtotal]);

  useEffect(() => {
    if (phase === "checkout" && lines.length === 0) setPhase("cart");
  }, [phase, lines.length]);

  const emailMismatch =
    customerEmailConfirm.length > 0 &&
    customerEmail.trim().toLowerCase() !== customerEmailConfirm.trim().toLowerCase();

  const goToCheckout = () => {
    setError(null);
    if (lines.length === 0) return;
    setPhase("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToCart = () => {
    setError(null);
    setPhase("cart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError("Seu carrinho está vazio.");
      setPhase("cart");
      return;
    }

    const mail = customerEmail.trim().toLowerCase();
    const mail2 = customerEmailConfirm.trim().toLowerCase();
    if (mail !== mail2) {
      setError("Os e-mails informados não coincidem. Confira os dois campos.");
      return;
    }

    const phoneDigits = phoneDigitsOnly(customerPhone);
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      setError("Informe um telefone válido com DDD (10 ou 11 dígitos) ou deixe em branco.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createPublicShopOrder({
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerDocument: customerDocument.trim() || null,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        shippingTotal,
        discountTotal,
        taxTotal,
        shipping: {
          recipientName: customerName.trim(),
          line1: line1.trim(),
          line2: line2.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim(),
          state: stateUf.trim(),
          postalCode: postalCode.trim(),
          country: "BR",
        },
        billingSameAsShipping: true,
        customerNote: customerNote.trim() || null,
      });
      clear();
      navigate("/loja", {
        replace: true,
        state: {
          orderThanks: {
            publicNumber: order.publicNumber,
            grandTotal: order.grandTotal,
          },
        },
      });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const increment = (productId: string) => {
    const line = lines.find((l) => l.productId === productId);
    if (!line) return;
    setQty(productId, line.quantity + 1);
  };

  const decrementOrRemove = (productId: string, quantity: number) => {
    if (quantity <= 1) removeLine(productId);
    else setQty(productId, quantity - 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-gray-50 to-gray-100/80 pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 pb-2 pt-6">
        <Link to="/loja" className="inline-flex items-center gap-1 text-sm font-bold text-regif-blue hover:underline">
          <ChevronLeft size={18} strokeWidth={2} />
          Continuar comprando
        </Link>
      </div>

      {phase === "cart" ? (
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section aria-labelledby="cart-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 id="cart-heading" className="text-2xl font-black tracking-tight text-regif-dark md:text-3xl">
                  Carrinho
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Revise os itens antes de fechar o pedido. Ajuste quantidades ou remova o que não quiser levar.
                </p>
              </div>
              {lines.length > 0 ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 shadow-sm ring-1 ring-gray-100">
                  {lines.reduce((a, l) => a + l.quantity, 0)}{" "}
                  {lines.reduce((a, l) => a + l.quantity, 0) === 1 ? "item" : "itens"}
                </span>
              ) : null}
            </div>

            {lines.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 py-16 text-center shadow-inner">
                <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-gray-300" strokeWidth={1.25} aria-hidden />
                <p className="text-lg font-bold text-regif-dark">Seu carrinho está vazio</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                  Explore a lojinha e adicione produtos para montar seu pedido.
                </p>
                <Link
                  to="/loja"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-regif-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-regif-blue/20 transition hover:bg-regif-blue/90"
                >
                  Ir para a lojinha
                  <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <ShopCartLines
                lines={lines}
                onIncrement={increment}
                onDecrementOrRemove={decrementOrRemove}
                onRemove={removeLine}
              />
            )}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40 ring-1 ring-black/[0.04]">
              <h2 className="text-lg font-black text-regif-dark">Resumo</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatBrl(subtotal)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-black text-regif-green">
                  <span>Total</span>
                  <span className="tabular-nums">{formatBrl(grandTotal)}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={lines.length === 0}
                onClick={goToCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-regif-green py-4 text-base font-black text-regif-dark shadow-md transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Fechar pedido
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                Na próxima etapa você informa seus dados e o endereço de entrega.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <button
            type="button"
            onClick={backToCart}
            className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-regif-blue hover:underline"
          >
            <ChevronLeft size={18} strokeWidth={2} />
            Voltar ao carrinho
          </button>

          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <form onSubmit={onSubmit} className="space-y-8">
              <header>
                <p className="text-xs font-bold uppercase tracking-widest text-regif-green">Etapa 2 de 2</p>
                <h1 className="mt-2 text-2xl font-black text-regif-dark md:text-3xl">Dados do pedido</h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                  Preencha com atenção: usaremos seu e-mail para confirmações e para você acompanhar o pedido depois.
                </p>
              </header>

              <section
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-md ring-1 ring-black/[0.03] md:p-8"
                aria-labelledby="personal-heading"
              >
                <h2 id="personal-heading" className="text-lg font-black text-regif-dark">
                  Dados pessoais
                </h2>
                <p className="mt-1 text-sm text-gray-500">Nome completo e forma de contato.</p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-gray-800 sm:col-span-2">
                    Nome completo
                    <input
                      required
                      autoComplete="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-regif-dark outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                      placeholder="Como aparece no documento"
                    />
                  </label>

                  <label className="block text-sm font-bold text-gray-800">
                    E-mail
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={clsx(
                        "mt-2 w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-regif-dark outline-none transition focus:bg-white focus:ring-4",
                        emailMismatch && customerEmailConfirm.length > 0
                          ? "border-amber-400 focus:border-regif-blue focus:ring-regif-blue/15"
                          : "border-gray-200 focus:border-regif-blue focus:ring-regif-blue/15"
                      )}
                      placeholder="voce@email.com"
                      aria-invalid={emailMismatch && customerEmailConfirm.length > 0}
                    />
                  </label>

                  <label className="block text-sm font-bold text-gray-800">
                    Confirme o e-mail
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={customerEmailConfirm}
                      onChange={(e) => setCustomerEmailConfirm(e.target.value)}
                      className={clsx(
                        "mt-2 w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-regif-dark outline-none transition focus:bg-white focus:ring-4",
                        emailMismatch
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-regif-blue focus:ring-regif-blue/15"
                      )}
                      placeholder="Digite o mesmo e-mail"
                      aria-invalid={emailMismatch}
                    />
                  </label>

                  {emailMismatch ? (
                    <p className="sm:col-span-2 text-sm font-semibold text-red-600" role="alert">
                      Os e-mails precisam ser iguais nos dois campos.
                    </p>
                  ) : null}

                  <label className="block text-sm font-bold text-gray-800">
                    Telefone (opcional)
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(maskBrazilPhoneInput(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 font-mono text-regif-dark outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                      placeholder="(99) 99999-9999"
                    />
                  </label>

                  <label className="block text-sm font-bold text-gray-800">
                    CPF (opcional)
                    <input
                      value={customerDocument}
                      onChange={(e) => setCustomerDocument(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                      placeholder="Somente números ou formatado"
                    />
                  </label>
                </div>
              </section>

              <section
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-md ring-1 ring-black/[0.03] md:p-8"
                aria-labelledby="address-heading"
              >
                <h2 id="address-heading" className="text-lg font-black text-regif-dark">
                  Endereço de entrega
                </h2>
                <p className="mt-1 text-sm text-gray-500">Para onde enviamos seu pedido.</p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-gray-800 sm:col-span-2">
                    Endereço (rua, número)
                    <input
                      required
                      autoComplete="street-address"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-800 sm:col-span-2">
                    Complemento
                    <input
                      autoComplete="address-line2"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-800">
                    Bairro
                    <input
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-800">
                    CEP
                    <input
                      required
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-800">
                    Cidade
                    <input
                      required
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                  <label className="block text-sm font-bold text-gray-800">
                    UF
                    <input
                      required
                      autoComplete="address-level1"
                      value={stateUf}
                      onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                      maxLength={2}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 uppercase outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-md ring-1 ring-black/[0.03] md:p-8">
                <label className="block text-sm font-bold text-gray-800">
                  Observações do pedido (opcional)
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition focus:border-regif-blue focus:bg-white focus:ring-4 focus:ring-regif-blue/15"
                    placeholder="Instruções para entrega, horários preferidos, etc."
                  />
                </label>
              </section>

              {error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 ring-1 ring-red-100">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={backToCart}
                  className="rounded-2xl border-2 border-gray-200 px-6 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Voltar ao carrinho
                </button>
                <button
                  type="submit"
                  disabled={submitting || lines.length === 0 || emailMismatch}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-regif-green px-8 py-3.5 text-base font-black text-regif-dark shadow-lg transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="animate-spin" size={22} /> : <ShoppingBag size={22} />}
                  Confirmar pedido
                </button>
              </div>
            </form>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg ring-1 ring-black/[0.04]">
                <h2 className="text-lg font-black text-regif-dark">Seu pedido</h2>
                <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm">
                  {lines.map((l) => (
                    <li key={l.productId} className="flex gap-3 border-b border-gray-50 pb-3 last:border-0">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {l.imageUrl ? (
                          <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{l.productTitle}</p>
                        <p className="text-xs text-gray-500">Qtd. {l.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-gray-100 pt-4 text-base font-black text-regif-green">
                  Total {formatBrl(grandTotal)}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
