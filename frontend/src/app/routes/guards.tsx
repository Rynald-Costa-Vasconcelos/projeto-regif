import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getRoleName,
  getSessionUser,
  getToken,
  hasPermission,
} from "../../shared/auth/session";

type GuardRule = {
  prefix: string;
  permission?: string;
  roles?: string[];
};

const guardRules: GuardRule[] = [
  // Backend permite ADMIN e EDITOR no módulo de notícias.
  { prefix: "/admin/news", roles: ["ADMIN", "EDITOR"], permission: "news.create" },

  // Backend permite ADMIN e EDITOR no módulo de documentos.
  { prefix: "/admin/documents", roles: ["ADMIN", "EDITOR"], permission: "documents.upload" },

  // Backend do módulo de usuários está restrito a ADMIN.
  { prefix: "/admin/users", roles: ["ADMIN"] },

  // Módulos futuros (front ainda usa permissões por slug).
  { prefix: "/admin/guilds", permission: "guilds.manage" },
  { prefix: "/admin/shop", roles: ["ADMIN", "EDITOR"], permission: "shop.manage" },
];

function findGuardRule(pathname: string) {
  return guardRules.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
}

export function RequireAuth() {
  const token = getToken();
  const user = getSessionUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RequireAdminPermission() {
  const location = useLocation();
  const user = getSessionUser();
  const roleName = getRoleName(user);
  const matchedRule = findGuardRule(location.pathname);

  if (matchedRule?.roles && (!roleName || !matchedRule.roles.includes(roleName))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (matchedRule?.permission && !hasPermission(user, matchedRule.permission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
