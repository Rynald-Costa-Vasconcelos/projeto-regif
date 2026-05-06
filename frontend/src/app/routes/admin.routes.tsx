import { Navigate, Route } from "react-router-dom";

import { AdminLayout } from "../../layouts/AdminLayout";
import {
  AdminUsers,
  BoardAdmin,
  BoardAssignmentsPage,
  BoardManagementPage,
  BoardMemberFormPage,
  BoardMembersPage,
  Dashboard,
  DocumentsList,
  DocumentsNew,
  NewsEdit,
  NewsList,
  NewsNew,
  NewsPreview,
  Setup,
  ShopAdminScreen,
  ShopOrderDetail,
  ShopProductForm,
} from "../../pages/admin";
import { RequireAdminPermission, RequireAuth } from "./guards";

export function AdminRoutes() {
  return (
    <>
      {/* Rotas “tela cheia” */}
      <Route path="/setup" element={<Setup />} />

      {/* Painel */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdminPermission />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* News */}
            <Route path="news" element={<NewsList />} />
            <Route path="news/new" element={<NewsNew />} />
            <Route path="news/:id" element={<NewsPreview />} />
            <Route path="news/:id/edit" element={<NewsEdit />} />

            {/* Documents */}
            <Route path="documents" element={<DocumentsList />} />
            <Route path="documents/new" element={<DocumentsNew />} />

            {/* Users */}
            <Route path="users" element={<AdminUsers />} />

            {/* Gestão de Pessoal / Diretoria */}
            <Route path="board" element={<BoardAdmin />} />
            <Route path="board/members" element={<BoardMembersPage />} />
            <Route path="board/members/new" element={<BoardMemberFormPage />} />
            <Route path="board/members/:id/edit" element={<BoardMemberFormPage />} />
            <Route path="board/management" element={<BoardManagementPage />} />
            <Route path="board/assignments" element={<BoardAssignmentsPage />} />

            {/* Lojinha */}
            <Route path="shop" element={<ShopAdminScreen />} />
            <Route path="shop/products" element={<Navigate to="/admin/shop" replace />} />
            <Route path="shop/products/new" element={<ShopProductForm />} />
            <Route path="shop/products/:id" element={<ShopProductForm />} />
            <Route path="shop/categories" element={<Navigate to="/admin/shop" replace />} />
            <Route path="shop/orders" element={<Navigate to="/admin/shop?tab=orders" replace />} />
            <Route path="shop/orders/:id" element={<ShopOrderDetail />} />
          </Route>
        </Route>
      </Route>
    </>
  );
}
