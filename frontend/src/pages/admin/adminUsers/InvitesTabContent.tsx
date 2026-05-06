import { Calendar, Loader2, Mail, Plus, RefreshCcw, Search, ServerCrash, Shield, Trash2 } from "lucide-react";
import clsx from "clsx";
import type {
  InviteDTO,
  InviteOnlyFilter,
  RoleDTO,
} from "../../../services/adminUserService";
import { fmtDate, InviteStatusBadge } from "./helpers";

interface InvitesTabContentProps {
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  inviteRoleId: string;
  setInviteRoleId: (value: string) => void;
  inviteDays: number;
  setInviteDays: (value: number) => void;
  inviteCreating: boolean;
  onCreateInvite: () => void;
  rolesLoading: boolean;
  roles: RoleDTO[];
  invSearch: string;
  setInvSearch: (value: string) => void;
  only: InviteOnlyFilter | "";
  setOnly: (value: InviteOnlyFilter | "") => void;
  onRefresh: () => void;
  invLoading: boolean;
  invError: { message: string } | null;
  invites: InviteDTO[];
  onRevokeInvite: (id: string) => void;
}

export function InvitesTabContent(props: InvitesTabContentProps) {
  const {
    inviteEmail,
    setInviteEmail,
    inviteRoleId,
    setInviteRoleId,
    inviteDays,
    setInviteDays,
    inviteCreating,
    onCreateInvite,
    rolesLoading,
    roles,
    invSearch,
    setInvSearch,
    only,
    setOnly,
    onRefresh,
    invLoading,
    invError,
    invites,
    onRevokeInvite,
  } = props;

  return (
    <>
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email para convite..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <select
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border bg-white text-sm font-semibold"
            disabled={rolesLoading || roles.length === 0}
            title="Cargo do convite"
          >
            {roles.length === 0 ? <option value="">Sem cargos</option> : null}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={inviteDays}
            onChange={(e) => setInviteDays(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border bg-white text-sm font-semibold"
            title="Expira em (dias)"
          >
            {[3, 7, 10, 15, 30].map((d) => (
              <option key={d} value={d}>
                {d} dias
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onCreateInvite}
            disabled={inviteCreating}
            className={clsx(
              "inline-flex items-center justify-center gap-2 bg-regif-blue text-white px-5 py-2.5 rounded-xl font-bold shadow active:scale-[0.99] transition",
              inviteCreating ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
            )}
          >
            {inviteCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus size={20} />}
            Criar Convite
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar convites por email..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRefresh();
              }}
            />
          </div>

          <select
            value={only}
            onChange={(e) => setOnly(e.target.value as InviteOnlyFilter | "")}
            className="px-3 py-2.5 rounded-xl border bg-white text-sm font-semibold"
            title="Filtrar convites"
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="expired">Expirados</option>
            <option value="used">Usados</option>
          </select>

          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-regif-blue hover:bg-blue-50 rounded-xl transition"
            title="Atualizar"
          >
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">{invites.length} convites</div>
        {invLoading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-regif-blue" />
            Carregando…
          </div>
        )}
      </div>

      {invLoading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border">
          <Loader2 className="animate-spin text-regif-blue" size={40} />
        </div>
      ) : invError ? (
        <div className="bg-red-50 p-6 rounded-2xl border text-red-700">
          <div className="flex items-start gap-3">
            <ServerCrash className="mt-0.5" />
            <div>
              <p className="font-bold">Falha na requisição</p>
              <p className="text-sm">{invError.message}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      ) : invites.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">
          Nenhum convite encontrado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {invites.map((i) => (
              <div key={i.id} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 leading-snug line-clamp-2">{i.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Shield size={14} className="text-gray-400" />
                        <span className="font-semibold text-regif-blue">{i.role?.name}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Expira: {fmtDate(i.expiresAt)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0"><InviteStatusBadge invite={i} /></div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Criado: <span className="text-gray-700 font-semibold">{fmtDate(i.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => onRevokeInvite(i.id)}
                    title="Revogar"
                    disabled={i.used}
                    className={clsx(
                      "p-2 rounded-xl border bg-white transition",
                      i.used ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50"
                    )}
                  >
                    <Trash2 size={18} className="text-regif-red" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Cargo</th>
                  <th className="px-6 py-4">Expira</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invites.map((i) => (
                  <tr key={i.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-900 truncate">{i.email}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 truncate">
                          Criado: {fmtDate(i.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="grid place-items-center"><InviteStatusBadge invite={i} /></div>
                    </td>
                    <td className="px-6 py-4 align-middle text-center text-gray-600">
                      <div className="inline-flex items-center gap-1.5">
                        <Shield size={14} className="text-gray-400" />
                        <span className="font-semibold">{i.role?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-center text-xs">
                      <div className="flex flex-col leading-tight">
                        <span className="text-gray-800 font-medium">{fmtDate(i.expiresAt)}</span>
                        <span className="text-gray-400">
                          {i.isExpired ? "Expirado" : i.isActive ? "Ativo" : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onRevokeInvite(i.id)}
                          title={i.used ? "Convite já usado" : "Revogar"}
                          disabled={i.used}
                          className={clsx(
                            "p-2 rounded-lg transition",
                            i.used ? "text-gray-300 cursor-not-allowed" : "text-regif-red hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
