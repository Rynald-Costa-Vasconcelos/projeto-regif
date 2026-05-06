import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HelpCircle, Home, Package, Search, ShoppingCart } from "lucide-react";
import clsx from "clsx";

import iconBranco from "../../assets/icons/icon_branco.png";
import { useShopCart } from "./ShopCartContext";

export function ShopMarketplaceNav() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lines } = useShopCart();

  const [searchDraft, setSearchDraft] = useState("");
  const qParam = searchParams.get("q") ?? "";

  const cartCount = useMemo(() => lines.reduce((a, l) => a + l.quantity, 0), [lines]);

  useEffect(() => {
    setSearchDraft(qParam);
  }, [qParam]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchDraft.trim();
    navigate(q ? `/loja?q=${encodeURIComponent(q)}` : "/loja");
  };

  const iconBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-regif-green/80";

  return (
    <header className="sticky top-0 z-50 bg-regif-blue text-white shadow-md">
      <div className="px-4 sm:px-6 lg:px-6">
        {/* Mobile: [logo][icons] / [—— search ——]. Desktop: logo | centered search | icons */}
        <div
          className={clsx(
            "mx-auto grid w-full max-w-7xl py-3",
            "gap-x-3 gap-y-3 sm:gap-x-4 md:gap-x-6",
            "max-sm:grid-cols-2 max-sm:grid-rows-[auto_auto]",
            "sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          )}
        >
          <Link
            to="/loja"
            className={clsx(
              "flex shrink-0 items-center justify-center rounded-xl py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-regif-green/80",
              "max-sm:col-start-1 max-sm:row-start-1 max-sm:justify-self-start"
            )}
            title="Lojinha oficial"
          >
            <img
              src={iconBranco}
              alt="REGIF — Lojinha"
              className="h-12 w-12 object-contain drop-shadow-md sm:h-14 sm:w-14 md:h-16 md:w-16"
            />
          </Link>

          <form
            onSubmit={onSearchSubmit}
            className={clsx(
              "min-w-0",
              "max-sm:col-span-2 max-sm:row-start-2 max-sm:flex max-sm:justify-center max-sm:px-0",
              "sm:col-start-2 sm:row-start-1 sm:flex sm:justify-center sm:px-2 md:px-3"
            )}
            role="search"
          >
            <div
              className={clsx(
                "flex h-10 min-w-0 overflow-hidden rounded-lg bg-white/95 shadow-sm",
                "w-full max-w-xl sm:max-w-md md:max-w-lg lg:max-w-xl",
                "max-sm:max-w-[min(36rem,calc(100vw-2rem))]"
              )}
            >
              <label htmlFor="shop-nav-search" className="sr-only">
                Buscar na lojinha
              </label>
              <input
                id="shop-nav-search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Buscar na lojinha…"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-regif-dark outline-none placeholder:text-gray-400 focus-visible:ring-0"
              />
              <button
                type="submit"
                title="Buscar"
                aria-label="Buscar"
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-regif-green text-white transition hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </div>
          </form>

          <div
            className={clsx(
              "flex shrink-0 items-center gap-0.5",
              "max-sm:col-start-2 max-sm:row-start-1 max-sm:justify-self-end",
              "sm:col-start-3 sm:row-start-1 sm:justify-self-end"
            )}
          >
            <Link
              to="/"
              title="Site da REGIF"
              aria-label="Ir para a página inicial do site"
              className={iconBtn}
            >
              <Home size={22} strokeWidth={2} />
            </Link>

            <a
              href="/loja/ajuda"
              target="_blank"
              rel="noreferrer noopener"
              title="Dúvidas sobre a lojinha"
              aria-label="Dúvidas sobre a lojinha (abre em nova aba)"
              className={iconBtn}
            >
              <HelpCircle size={22} strokeWidth={2} />
            </a>

            <Link
              to="/loja/meus-pedidos"
              title="Meus pedidos"
              aria-label="Acompanhar pedidos feitos na lojinha"
              className={iconBtn}
            >
              <Package size={22} strokeWidth={2} />
            </Link>

            <Link
              to="/loja/finalizar"
              title={cartCount > 0 ? `Carrinho (${cartCount} itens)` : "Carrinho"}
              aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : "Carrinho"}
              className={clsx(iconBtn, "relative")}
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {cartCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-regif-green px-1 text-[10px] font-black leading-none text-regif-dark ring-2 ring-regif-blue">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
