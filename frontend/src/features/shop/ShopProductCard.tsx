import { Link } from "react-router-dom";
import clsx from "clsx";

import type { ShopPublicProduct } from "../../services/shopService";

export function formatShopBrl(value: string | number | null | undefined) {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function shopPrimaryImage(p: ShopPublicProduct) {
  const prim = p.images.find((i) => i.isPrimary);
  const img = prim ?? p.images[0];
  return img?.thumbUrl || img?.url || null;
}

export function ShopProductCard({ product: p }: { product: ShopPublicProduct }) {
  const img = shopPrimaryImage(p);
  const soldOut = p.stockQuantity <= 0;

  const body = (
    <>
      <div className={clsx("aspect-[4/3] bg-gray-100 overflow-hidden relative", soldOut && "grayscale-[0.35]")}>
        {img ? (
          <img
            src={img}
            alt=""
            className={clsx(
              "w-full h-full object-cover transition-transform duration-500",
              !soldOut && "group-hover:scale-[1.02]"
            )}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
        )}
        {soldOut && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full border border-rose-100 bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-wide text-rose-800 shadow-lg">
              Esgotado
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3
          className={clsx(
            "line-clamp-2 font-bold text-regif-dark transition-colors",
            !soldOut && "group-hover:text-regif-blue"
          )}
        >
          {p.title}
        </h3>
        {p.excerpt && <p className="line-clamp-2 text-sm text-gray-500">{p.excerpt}</p>}
        <p className={clsx("pt-1 font-black", soldOut ? "text-gray-400" : "text-regif-green")}>
          {formatShopBrl(p.price)}
        </p>
      </div>
    </>
  );

  return (
    <article
      className={clsx(
        "group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition",
        soldOut ? "cursor-not-allowed opacity-95" : "hover:shadow-md"
      )}
    >
      {soldOut ? (
        <div className="block rounded-2xl" aria-label={`${p.title} — esgotado`}>
          {body}
        </div>
      ) : (
        <Link
          to={`/loja/produto/${encodeURIComponent(p.slug)}`}
          className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-regif-blue"
        >
          {body}
        </Link>
      )}
    </article>
  );
}
