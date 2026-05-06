import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

type BoardNavKey = "home" | "members" | "management" | "assignments";

const tabs: Array<{ key: BoardNavKey; label: string; to: string }> = [
  { key: "home", label: "Início", to: "/admin/board" },
  { key: "members", label: "Membros", to: "/admin/board/members" },
  { key: "assignments", label: "Cargos", to: "/admin/board/assignments" },
  { key: "management", label: "Informações", to: "/admin/board/management" },
];

function activeKey(pathname: string): BoardNavKey {
  if (pathname.startsWith("/admin/board/members")) return "members";
  if (pathname.startsWith("/admin/board/management")) return "management";
  if (pathname.startsWith("/admin/board/assignments")) return "assignments";
  return "home";
}

export function BoardModuleNav() {
  const { pathname } = useLocation();
  const current = activeKey(pathname);

  return (
    <div className="w-full overflow-x-auto pb-1 -mb-1">
      <nav
        className="inline-flex min-w-full sm:min-w-0 rounded-full border border-gray-200/90 bg-white p-1 shadow-sm shadow-gray-200/30 ring-1 ring-black/[0.04]"
        aria-label="Navegação do módulo Diretoria"
      >
        {tabs.map((t) => {
          const isActive = current === t.key;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={clsx(
                "flex-1 whitespace-nowrap text-center rounded-full px-3 py-2.5 text-xs font-black tracking-tight transition-all sm:px-4 sm:text-sm",
                isActive
                  ? "bg-regif-blue text-white shadow-md shadow-regif-blue/25"
                  : "text-regif-blue hover:bg-regif-blue/[0.06]"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
