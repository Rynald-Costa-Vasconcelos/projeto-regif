import { Outlet } from "react-router-dom";

import { ShopCartProvider } from "../../features/shop/ShopCartContext";
import { ShopMarketplaceNav } from "../../features/shop/ShopPublicHeader";

export function ShopLayout() {
  return (
    <ShopCartProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <ShopMarketplaceNav />
        <Outlet />
      </div>
    </ShopCartProvider>
  );
}
