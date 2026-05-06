import { Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import clsx from "clsx";

import { ShopProductsList } from "./ShopProductsList";
import { ShopOrdersList } from "./ShopOrdersList";

type ShopTab = "products" | "orders";

export function ShopAdminScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: ShopTab = searchParams.get("tab") === "orders" ? "orders" : "products";

  const setTab = (next: ShopTab) => {
    if (next === "orders") {
      setSearchParams({ tab: "orders" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-regif-dark flex items-center gap-2">
            <LayoutGrid className="text-regif-blue shrink-0" />
            Lojinha
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">
            Catálogo público, criação e edição de produtos, e acompanhamento de pedidos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {tab === "products" ? (
            <Link
              to="/admin/shop/products/new"
              className="inline-flex items-center justify-center gap-2 bg-regif-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow active:scale-[0.99] transition whitespace-nowrap"
            >
              <Plus size={20} /> Novo produto
            </Link>
          ) : null}

          <div className="inline-flex rounded-2xl border bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("products")}
              className={clsx(
                "px-4 py-2.5 text-sm font-black transition",
                tab === "products" ? "bg-regif-blue text-white" : "hover:bg-slate-50 text-slate-800"
              )}
            >
              Produtos
            </button>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={clsx(
                "px-4 py-2.5 text-sm font-black transition",
                tab === "orders" ? "bg-regif-blue text-white" : "hover:bg-slate-50 text-slate-800"
              )}
            >
              Pedidos
            </button>
          </div>
        </div>
      </div>

      {tab === "products" ? <ShopProductsList embedded /> : <ShopOrdersList embedded />}
    </div>
  );
}
