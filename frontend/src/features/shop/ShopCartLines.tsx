import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";

import type { CartLine } from "./ShopCartContext";

function formatBrl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function lineUnitNumber(unitPrice: string) {
  return Number(String(unitPrice).replace(",", "."));
}

type Props = {
  lines: CartLine[];
  onIncrement: (productId: string) => void;
  onDecrementOrRemove: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function ShopCartLines({ lines, onIncrement, onDecrementOrRemove, onRemove }: Props) {
  if (lines.length === 0) return null;

  return (
    <ul className="space-y-4">
      {lines.map((l) => {
        const unit = lineUnitNumber(l.unitPrice);
        const lineTotal = unit * l.quantity;
        const thumb = l.imageUrl?.trim();

        return (
          <li
            key={l.productId}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <Link
                to={`/loja/produto/${encodeURIComponent(l.productSlug)}`}
                className="mx-auto shrink-0 sm:mx-0"
                title={l.productTitle}
              >
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100 sm:h-32 sm:w-32">
                  {thumb ? (
                    <img src={thumb} alt={l.productTitle} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="px-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Sem foto
                    </span>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/loja/produto/${encodeURIComponent(l.productSlug)}`}
                  className="block font-bold leading-snug text-regif-dark underline-offset-4 hover:text-regif-blue hover:underline"
                >
                  {l.productTitle}
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {formatBrl(unit)}
                  {l.quantity > 1 ? <span className="text-gray-400"> · unidade</span> : null}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div
                    className={clsx(
                      "inline-flex h-11 items-stretch overflow-hidden rounded-xl border-2 bg-white shadow-sm",
                      "border-amber-400/70 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/25"
                    )}
                    role="group"
                    aria-label={`Quantidade de ${l.productTitle}`}
                  >
                    <button
                      type="button"
                      onClick={() => onDecrementOrRemove(l.productId, l.quantity)}
                      className={clsx(
                        "flex min-w-[2.75rem] items-center justify-center px-2 text-gray-700 transition",
                        "hover:bg-amber-50 active:bg-amber-100",
                        l.quantity <= 1 ? "text-red-600 hover:bg-red-50 active:bg-red-100" : ""
                      )}
                      aria-label={l.quantity <= 1 ? "Remover item do carrinho" : "Diminuir quantidade"}
                    >
                      {l.quantity <= 1 ? <Trash2 size={18} strokeWidth={2} /> : <Minus size={18} strokeWidth={2} />}
                    </button>
                    <span className="flex min-w-[2.5rem] items-center justify-center border-x border-amber-400/40 px-2 text-base font-black tabular-nums text-regif-dark">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(l.productId)}
                      disabled={l.quantity >= 999}
                      className="flex min-w-[2.75rem] items-center justify-center px-2 text-gray-700 transition hover:bg-amber-50 active:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={18} strokeWidth={2} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(l.productId)}
                    className="text-sm font-bold text-red-600 underline decoration-red-300 underline-offset-2 transition hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end justify-between gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Subtotal</p>
                <p className="text-xl font-black tabular-nums text-regif-dark">{formatBrl(lineTotal)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
