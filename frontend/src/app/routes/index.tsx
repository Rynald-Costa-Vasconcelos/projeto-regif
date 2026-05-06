import { Navigate, Route, Routes } from "react-router-dom";
import { PublicRoutes } from "./public.routes";
import { AdminRoutes } from "./admin.routes";
import { AcceptInvitePage, LoginPage } from "../../pages/auth";

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      {PublicRoutes()}

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />

      {/* Admin + setup */}
      {AdminRoutes()}

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
