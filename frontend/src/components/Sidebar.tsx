import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  School,
  BadgeCheck,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { getRoleName, getSessionUser, hasPermission } from "../shared/auth/session";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
  onLogout: () => void;
}

function shopCatalogNavActive(pathname: string, search: string) {
  if (!pathname.startsWith("/admin/shop")) return false;
  if (pathname.startsWith("/admin/shop/orders")) return false;
  if (pathname === "/admin/shop" && new URLSearchParams(search).get("tab") === "orders") return false;
  return true;
}

function shopOrdersNavActive(pathname: string, search: string) {
  if (pathname.startsWith("/admin/shop/orders")) return true;
  if (pathname === "/admin/shop" && new URLSearchParams(search).get("tab") === "orders") return true;
  return false;
}

function NavItem({
  to,
  icon: Icon,
  label,
  showText,
  isActive,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  showText: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      title={!showText ? label : ""}
      onClick={onClick}
      className={clsx(
        "flex items-center py-3 rounded-lg transition-all duration-200 group font-medium",
        showText ? "gap-3 px-3 justify-start" : "justify-center px-2",
        isActive ? "bg-regif-blue text-white shadow-md" : "text-regif-dark hover:bg-gray-100 hover:text-regif-blue"
      )}
    >
      <Icon
        size={22}
        className={clsx(
          "shrink-0 transition-colors",
          isActive ? "text-regif-green" : "text-gray-400 group-hover:text-regif-blue"
        )}
      />

      <span
        className={clsx(
          "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
          showText ? "w-auto opacity-100 ml-0" : "w-0 opacity-0"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, closeMobile, onLogout }: SidebarProps) {
  const location = useLocation();
  const user = getSessionUser();
  const isAdmin = getRoleName(user) === "ADMIN";
  const canShop = hasPermission(user, "shop.manage");
  const canBoard = hasPermission(user, "team.manage");

  const showText = !isCollapsed || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobile} />
      )}

      <aside
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-xl h-screen",
          isCollapsed ? "md:w-20" : "md:w-64",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={clsx("hidden md:flex p-4", showText ? "justify-end" : "justify-center")}>
          <button
            onClick={toggleCollapse}
            className="p-1.5 text-gray-400 hover:text-regif-blue hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <div className="md:hidden p-4 flex justify-between items-center border-b border-gray-100 mb-2">
          <span className="text-regif-blue font-bold text-lg">Menu REGIF</span>
          <button onClick={closeMobile} className="text-gray-500 hover:text-regif-red">
            <ChevronLeft />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          <NavItem
            to="/admin/dashboard"
            icon={LayoutDashboard}
            label="Início"
            showText={showText}
            isActive={location.pathname === "/admin/dashboard" || location.pathname.startsWith("/admin/dashboard/")}
            onClick={closeMobile}
          />

          <div className="py-2">
            <p className={clsx("text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3", !showText && "sr-only")}>
              Conteúdo
            </p>
            <NavItem
              to="/admin/news"
              icon={Newspaper}
              label="Notícias"
              showText={showText}
              isActive={location.pathname === "/admin/news" || location.pathname.startsWith("/admin/news/")}
              onClick={closeMobile}
            />
            <NavItem
              to="/admin/documents"
              icon={FileText}
              label="Transparência"
              showText={showText}
              isActive={location.pathname === "/admin/documents" || location.pathname.startsWith("/admin/documents/")}
              onClick={closeMobile}
            />
          </div>

          <div className="py-2">
            <p className={clsx("text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3", !showText && "sr-only")}>
              Institucional
            </p>
            <NavItem
              to="/admin/guilds"
              icon={School}
              label="Grêmios"
              showText={showText}
              isActive={location.pathname === "/admin/guilds" || location.pathname.startsWith("/admin/guilds/")}
              onClick={closeMobile}
            />
            {canBoard && (
              <NavItem
                to="/admin/board"
                icon={BadgeCheck}
                label="Diretoria"
                showText={showText}
                isActive={location.pathname === "/admin/board" || location.pathname.startsWith("/admin/board/")}
                onClick={closeMobile}
              />
            )}
            {canShop && (
              <>
                <NavItem
                  to="/admin/shop"
                  icon={ShoppingBag}
                  label="Lojinha"
                  showText={showText}
                  isActive={shopCatalogNavActive(location.pathname, location.search)}
                  onClick={closeMobile}
                />
                <NavItem
                  to="/admin/shop?tab=orders"
                  icon={ShoppingCart}
                  label="Pedidos (loja)"
                  showText={showText}
                  isActive={shopOrdersNavActive(location.pathname, location.search)}
                  onClick={closeMobile}
                />
              </>
            )}
            {isAdmin && (
              <NavItem
                to="/admin/users"
                icon={Users}
                label="Equipe/Gestão"
                showText={showText}
                isActive={location.pathname === "/admin/users" || location.pathname.startsWith("/admin/users/")}
                onClick={closeMobile}
              />
            )}
          </div>

          <div className="py-2 border-t border-gray-50">
            <p className={clsx("text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3", !showText && "sr-only")}>
              Sistema
            </p>
            <NavItem
              to="/admin/settings"
              icon={Settings}
              label="Configurações"
              showText={showText}
              isActive={location.pathname === "/admin/settings" || location.pathname.startsWith("/admin/settings/")}
              onClick={closeMobile}
            />
          </div>
        </nav>

        <div className="p-3 border-t border-gray-100 mt-auto">
          <button
            onClick={onLogout}
            title={!showText ? "Sair" : ""}
            className={clsx(
              "flex items-center py-3 w-full rounded-lg text-regif-red hover:bg-red-50 transition-colors font-medium group",
              showText ? "gap-3 px-3 justify-start" : "justify-center px-2"
            )}
          >
            <LogOut size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span
              className={clsx(
                "whitespace-nowrap overflow-hidden transition-all duration-300",
                showText ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              Sair da Conta
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
