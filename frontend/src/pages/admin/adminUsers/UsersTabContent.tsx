import {
  Ban,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Search,
  ServerCrash,
  Shield,
  User as UserIcon,
} from "lucide-react";
import clsx from "clsx";
import type {
  RoleDTO,
  RoleName,
  UserListItemDTO,
  UserStatusFilter,
} from "../../../services/adminUserService";
import { fmtDate, fmtDateTime, UserStatusBadge } from "./helpers";

interface UsersTabContentProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  status: UserStatusFilter;
  setStatus: (value: UserStatusFilter) => void;
  role: RoleName | "";
  setRole: (value: RoleName | "") => void;
  rolesLoading: boolean;
  roles: RoleDTO[];
  onRefresh: () => void;
  loading: boolean;
  error: { message: string } | null;
  users: UserListItemDTO[];
  onToggleUserStatus: (user: UserListItemDTO) => void;
  onChangeUserRole: (userId: string, roleId: string) => void;
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  rangeText: string;
}

export function UsersTabContent(props: UsersTabContentProps) {
  const {
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    role,
    setRole,
    rolesLoading,
    roles,
    onRefresh,
    loading,
    error,
    users,
    onToggleUserStatus,
    onChangeUserRole,
    page,
    totalPages,
    canPrev,
    canNext,
    onPrev,
    onNext,
    rangeText,
  } = props;

  return (
    <>
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-regif-blue/20 focus:bg-white transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRefresh();
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatusFilter)}
            className="px-3 py-2.5 rounded-xl border bg-white text-sm font-semibold"
            title="Filtrar por status"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="DISABLED">Desativados</option>
            <option value="PENDING">Pendentes</option>
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleName | "")}
            className="px-3 py-2.5 rounded-xl border bg-white text-sm font-semibold"
            title="Filtrar por cargo"
            disabled={rolesLoading}
          >
            <option value="">Todos os cargos</option>
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-regif-blue hover:bg-blue-50 rounded-xl transition"
            title="Pesquisar/Atualizar"
          >
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">{rangeText}</div>
        {loading && (
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-regif-blue" />
            Carregando…
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border">
          <Loader2 className="animate-spin text-regif-blue" size={40} />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl border text-red-700">
          <div className="flex items-start gap-3">
            <ServerCrash className="mt-0.5" />
            <div>
              <p className="font-bold">Falha na requisição</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 leading-snug line-clamp-2">{u.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <UserIcon size={14} className="text-gray-400" />
                        <span className="truncate max-w-[210px]">{u.email}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Shield size={14} className="text-gray-400" />
                        <span className="font-semibold text-regif-blue">{u.role?.name}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{fmtDate(u.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0"><UserStatusBadge status={u.status} /></div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Último login: <span className="text-gray-700 font-semibold">{fmtDateTime(u.lastLoginAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role?.id}
                      disabled={rolesLoading || roles.length === 0}
                      onChange={(e) => onChangeUserRole(u.id, e.target.value)}
                      className="px-3 py-2 rounded-xl border bg-white text-xs font-bold"
                      title="Alterar cargo"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onToggleUserStatus(u)}
                      title={u.status === "ACTIVE" ? "Desativar" : "Ativar"}
                      className={clsx(
                        "p-2 rounded-xl border bg-white transition",
                        u.status === "ACTIVE" ? "hover:bg-amber-50" : "hover:bg-green-50"
                      )}
                    >
                      {u.status === "ACTIVE" ? (
                        <Ban size={18} className="text-amber-600" />
                      ) : (
                        <CheckCircle2 size={18} className="text-regif-green" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-4 text-left">Usuário</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Cargo</th>
                  <th className="px-6 py-4">Último login</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-900 truncate">{u.name}</span>
                        <span className="text-[10px] text-regif-blue font-bold uppercase mt-1 truncate">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="grid place-items-center"><UserStatusBadge status={u.status} /></div>
                    </td>
                    <td className="px-6 py-4 align-middle text-center text-gray-600">
                      <div className="inline-flex items-center gap-1.5">
                        <Shield size={14} className="text-gray-400" />
                        <span className="font-semibold">{u.role?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-center text-xs">
                      <div className="flex flex-col leading-tight">
                        <span className="text-gray-800 font-medium">{fmtDateTime(u.lastLoginAt)}</span>
                        <span className="text-gray-400">Criado: {fmtDate(u.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role?.id}
                          disabled={rolesLoading || roles.length === 0}
                          onChange={(e) => onChangeUserRole(u.id, e.target.value)}
                          className="px-3 py-2 rounded-xl border bg-white text-xs font-black shadow-sm hover:bg-slate-50 transition"
                          title="Alterar cargo"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onToggleUserStatus(u)}
                          className={clsx(
                            "p-2 rounded-lg transition",
                            u.status === "ACTIVE"
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-regif-green hover:bg-green-50"
                          )}
                          title={u.status === "ACTIVE" ? "Desativar" : "Ativar"}
                        >
                          {u.status === "ACTIVE" ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-gray-600">
              Página <span className="font-black text-gray-900">{page}</span> de{" "}
              <span className="font-black text-gray-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev || loading}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
                  !canPrev || loading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext || loading}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
                  !canNext || loading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                )}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
