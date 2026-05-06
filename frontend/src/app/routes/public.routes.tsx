// src/app/routes/public.routes.tsx
import { Route } from "react-router-dom";

import { PublicLayout } from "../../layouts/PublicLayout";
import {
  DocumentsArchive,
  Home,
  NewsArchive,
  NewsPost,
  QuemSomos,
  ShopCategoryPage,
  ShopCheckoutPage,
  ShopGuestOrdersPage,
  ShopHelpPage,
  ShopHome,
  ShopLayout,
  ShopProductPage,
} from "../../pages/public";

export function PublicRoutes() {
  return (
    <Route path="/" element={<PublicLayout />}>
      <Route index element={<Home />} />

      <Route path="loja" element={<ShopLayout />}>
        <Route index element={<ShopHome />} />
        <Route path="categoria/:parentSlug" element={<ShopCategoryPage />} />
        <Route path="ajuda" element={<ShopHelpPage />} />
        <Route path="meus-pedidos" element={<ShopGuestOrdersPage />} />
        <Route path="produto/:slug" element={<ShopProductPage />} />
        <Route path="finalizar" element={<ShopCheckoutPage />} />
      </Route>

      {/* Arquivos públicos */}
      <Route path="noticias/arquivo" element={<NewsArchive />} />
      <Route path="documentos/arquivo" element={<DocumentsArchive />} />
      <Route path="quem-somos" element={<QuemSomos />} />

      {/* Detalhe */}
      <Route path="noticias/:slug" element={<NewsPost />} />
    </Route>
  );
}
