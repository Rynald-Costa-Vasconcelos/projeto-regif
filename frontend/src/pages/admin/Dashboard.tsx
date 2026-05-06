import { Children, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Newspaper,
  FileText,
  Users,
  Activity,
  Home,
  School,
  BadgeCheck,
  Calendar,
  LayoutGrid,
  ShoppingBag,
  ShoppingCart,
  Plus,
  List,
  Loader2,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import {
  getRoleName,
  getSessionUser,
  hasPermission,
  type SessionUser,
} from "../../shared/auth/session";
import {
  orderStatusBadgePt,
  paymentStatusBadgePt,
} from "../../features/shop/shopOrderLabels";
import { listAdminShopOrders } from "../../services/shopService";
import { toApiError } from "../../shared/api/contracts";

export function Dashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setUser(getSessionUser());

    const now = new Date();
    setDateStr(new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(now));
  }, []);

  if (!user) return null;

  const roleDisplay = getRoleName(user);
  const isAdmin = roleDisplay === "ADMIN";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{dateStr}</h6>
          <h1 className="text-3xl font-bold text-regif-blue">Olá, {user.name.split(" ")[0]}!</h1>
          <p className="text-gray-500 mt-1">
            Painel de Gestão • <span className="font-semibold text-regif-green">{roleDisplay}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Activity size={20} className="text-regif-blue" />
          Gerenciar Conteúdo do Site
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ShortcutGroup
            title="Atalhos"
            subtitle="Abrir o site em nova aba"
            icon={Home}
            iconWrapClass="bg-slate-50 text-slate-700"
          >
            <ExternalQuickAction href="/" icon={Home} label="Home do site" color="text-slate-700" bg="bg-slate-50" />
            <ExternalQuickAction
              href="/loja"
              icon={ShoppingBag}
              label="Home da lojinha"
              color="text-slate-700"
              bg="bg-slate-50"
            />
          </ShortcutGroup>

          {hasPermission(user, "news.create") && (
            <ShortcutGroup
              title="Notícias"
              subtitle="Publicações do portal"
              icon={Newspaper}
              iconWrapClass="bg-blue-50 text-regif-blue"
            >
              <QuickAction to="/admin/news" icon={List} label="Listar" color="text-regif-blue" bg="bg-blue-50" />
              <QuickAction to="/admin/news/new" icon={Newspaper} label="Nova notícia" color="text-regif-blue" bg="bg-blue-50" />
            </ShortcutGroup>
          )}

          {hasPermission(user, "documents.upload") && (
            <ShortcutGroup
              title="Transparência"
              subtitle="Documentos oficiais"
              icon={FileText}
              iconWrapClass="bg-green-50 text-regif-green"
            >
              <QuickAction to="/admin/documents" icon={List} label="Listar" color="text-regif-green" bg="bg-green-50" />
              <QuickAction to="/admin/documents/new" icon={Plus} label="Novo documento" color="text-regif-green" bg="bg-green-50" />
            </ShortcutGroup>
          )}

          {hasPermission(user, "shop.manage") && (
            <ShortcutGroup
              title="Lojinha"
              subtitle="Catálogo e pedidos"
              icon={ShoppingBag}
              iconWrapClass="bg-pink-50 text-pink-600"
            >
              <QuickAction to="/admin/shop" icon={ShoppingBag} label="Produtos" color="text-pink-600" bg="bg-pink-50" />
              <QuickAction
                to="/admin/shop?tab=orders"
                icon={ShoppingCart}
                label="Pedidos"
                color="text-pink-600"
                bg="bg-pink-50"
              />
            </ShortcutGroup>
          )}

          {hasPermission(user, "guilds.manage") && (
            <ShortcutGroup
              title="Grêmios"
              subtitle="Rede estudantil"
              icon={School}
              iconWrapClass="bg-indigo-50 text-indigo-600"
            >
              <QuickAction to="/admin/guilds" icon={School} label="Gerenciar grêmios" color="text-indigo-600" bg="bg-indigo-50" />
            </ShortcutGroup>
          )}

          {isAdmin && (
            <ShortcutGroup
              title="Equipe"
              subtitle="Usuários e convites"
              icon={Users}
              iconWrapClass="bg-red-50 text-regif-red"
            >
              <QuickAction to="/admin/users" icon={Users} label="Gestão de pessoas" color="text-regif-red" bg="bg-red-50" />
            </ShortcutGroup>
          )}
        </div>
      </div>

      {hasPermission(user, "shop.manage") && <ShopOrdersHomeSnippet />}

      {hasPermission(user, "team.manage") && <BoardHomeWidget />}

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <School size={18} className="text-indigo-600" />
            Rede de Grêmios
          </h3>
          <div className="space-y-4">
            <GuildStatusItem name="Djalma Maranhão" campus="Natal Central" status="Ativo" />
            <GuildStatusItem name="Nilo Peçanha" campus="Parnamirim" status="Ativo" />
            <GuildStatusItem name="Paulo Freire" campus="Natal Zona Norte" status="Inativo" />
            {hasPermission(user, "guilds.manage") && (
              <Link
                to="/admin/guilds"
                className="block text-center text-xs font-bold text-gray-400 hover:text-regif-blue mt-4 transition-colors"
              >
                VER TODOS OS 20 GRÊMIOS
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutGroup({
  title,
  subtitle,
  icon: Icon,
  iconWrapClass,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Newspaper;
  iconWrapClass: string;
  children: React.ReactNode;
}) {
  const n = Children.toArray(children).filter(Boolean).length;
  const cols = n >= 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start gap-3 border-b border-gray-50 pb-3">
        <div className={clsx("p-2.5 rounded-xl shrink-0", iconWrapClass)}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-gray-800 leading-tight">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className={clsx("grid gap-3", cols)}>{children}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, bg, to }: any) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-regif-blue hover:shadow-lg transition-all group bg-white min-h-[108px]"
    >
      <div
        className={clsx(
          "p-3 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1",
          bg,
          color
        )}
      >
        <Icon size={22} />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-regif-blue transition-colors text-center leading-snug">
        {label}
      </span>
    </Link>
  );
}

function ExternalQuickAction({ icon: Icon, label, color, bg, href }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 hover:border-regif-blue hover:shadow-lg transition-all group bg-white min-h-[108px]"
    >
      <div
        className={clsx(
          "p-3 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1",
          bg,
          color
        )}
      >
        <Icon size={22} />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-regif-blue transition-colors text-center leading-snug">
        {label}
      </span>
    </a>
  );
}

function formatSnippetBrl(s: string | undefined) {
  if (s === undefined) return "—";
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return s;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function ShopOrdersHomeSnippet() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listAdminShopOrders({ page: 1, pageSize: 8 });
        if (cancelled) return;
        setRows(res.items);
        setErr(null);
      } catch (e) {
        if (!cancelled) setErr(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40 ring-1 ring-black/[0.04] md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 ring-1 ring-pink-100/80">
            <ShoppingCart size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-regif-green">Lojinha</p>
            <h3 className="mt-0.5 text-xl font-black tracking-tight text-regif-dark">Pedidos da lojinha</h3>
            <p className="mt-1 max-w-xl text-sm leading-snug text-gray-600">
              Últimos pedidos recebidos. Para filtros, busca e a lista completa, abra a aba Pedidos.
            </p>
          </div>
        </div>
        <Link
          to="/admin/shop?tab=orders"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-regif-blue px-5 py-3 text-sm font-black text-white shadow-md shadow-regif-blue/20 transition hover:bg-regif-blue/90"
        >
          Ver todos os pedidos
          <ShoppingBag size={18} strokeWidth={2} />
        </Link>
      </div>

      {err ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{err}</div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 py-14">
          <Loader2 className="h-9 w-9 animate-spin text-regif-blue" />
          <p className="text-sm font-semibold text-gray-600">Carregando pedidos…</p>
        </div>
      ) : rows.length === 0 && !err ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-300" strokeWidth={1.25} />
          <p className="font-bold text-gray-800">Nenhum pedido ainda</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">Quando houver vendas na lojinha, elas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 md:overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[34%]" />
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50/90">
                <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-gray-500 lg:px-4">Nº</th>
                <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-gray-500 lg:px-4">Cliente</th>
                <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-gray-500 lg:px-4">Situação</th>
                <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-500 lg:px-4">
                  Total
                </th>
                <th className="px-2 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((o) => {
                const statusKey = String(o.status ?? "");
                const payKey = String(o.paymentStatus ?? "");
                const os = orderStatusBadgePt(statusKey);
                const pay = paymentStatusBadgePt(payKey);
                return (
                  <tr key={String(o.id)} className="transition-colors hover:bg-regif-blue/[0.04]">
                    <td className="px-3 py-3 align-top lg:px-4">
                      <span className="break-words font-mono text-[11px] font-black leading-snug text-regif-blue">
                        {String(o.publicNumber ?? "—")}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top lg:px-4">
                      <div className="break-words font-bold leading-snug text-gray-900">{String(o.customerName ?? "—")}</div>
                      <div className="mt-0.5 break-words text-xs leading-snug text-gray-500">{String(o.customerEmail ?? "")}</div>
                    </td>
                    <td className="px-3 py-3 align-top lg:px-4">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={clsx(
                            "inline-block w-full whitespace-normal break-words rounded-xl px-2 py-1.5 text-center text-[10px] font-black uppercase leading-snug tracking-normal lg:text-[11px]",
                            os.className
                          )}
                        >
                          {os.label}
                        </span>
                        <span
                          className={clsx(
                            "inline-block w-full whitespace-normal break-words rounded-xl px-2 py-1 text-center text-[10px] font-black uppercase leading-snug tracking-normal",
                            pay.className
                          )}
                        >
                          {pay.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-right text-sm font-black tabular-nums leading-snug text-regif-green lg:px-4 lg:text-base">
                      {formatSnippetBrl(o.grandTotal as string)}
                    </td>
                    <td className="px-2 py-3 align-top text-right">
                      <Link
                        to={`/admin/shop/orders/${String(o.id)}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-regif-blue shadow-sm transition hover:border-regif-blue/40 hover:bg-regif-blue/5"
                        title="Abrir pedido"
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BoardHomeWidget() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/40 ring-1 ring-black/[0.04] md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100/80">
            <BadgeCheck size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-regif-green">Diretoria</p>
            <h3 className="mt-0.5 text-xl font-black tracking-tight text-regif-dark">Gestão de pessoal e transparência</h3>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-gray-600">
              Acesso rápido às áreas do módulo (membros, informações públicas da gestão e nomeação por cargos).
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/admin/board"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-regif-blue px-5 py-3 text-sm font-black text-white shadow-md shadow-regif-blue/20 transition hover:bg-regif-blue/90"
          >
            Abrir dashboard
            <BadgeCheck size={18} strokeWidth={2} />
          </Link>
          <a
            href="/quem-somos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            Página pública
            <ChevronRight size={18} strokeWidth={2.5} className="text-regif-blue" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction to="/admin/board/members" icon={Users} label="Membros (cards)" color="text-teal-700" bg="bg-teal-50" />
        <QuickAction to="/admin/board/members/new" icon={Plus} label="Novo membro" color="text-teal-700" bg="bg-teal-50" />
        <QuickAction to="/admin/board/management" icon={Calendar} label="Informações da gestão" color="text-teal-700" bg="bg-teal-50" />
        <QuickAction to="/admin/board/assignments" icon={LayoutGrid} label="Nomear cargos" color="text-teal-700" bg="bg-teal-50" />
      </div>
    </div>
  );
}

function GuildStatusItem({ name, campus, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div>
        <h5 className="text-xs font-bold text-gray-700">{name}</h5>
        <p className="text-[10px] text-gray-400">Campus {campus}</p>
      </div>
      <span
        className={clsx(
          "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full",
          status === "Ativo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}
      >
        {status}
      </span>
    </div>
  );
}
