// src/pages/admin/AdminUsers.tsx
import { useEffect, useRef, useState } from "react";
import {
  Users,
} from "lucide-react";
import clsx from "clsx";
import { UsersTabContent } from "./adminUsers/UsersTabContent";
import { InvitesTabContent } from "./adminUsers/InvitesTabContent";

import {
  adminUserService,
  type UserStatus,
  type RoleDTO,
  type RoleName,
  type UserListItemDTO,
  type UsersListResponseDTO,
  type UserStatusFilter,
  type InviteDTO,
  type InviteOnlyFilter,
  rangeText,
} from "../../services/adminUserService";

// ✅ Paginação padrão fixa no Admin (igual NewsList)
const PAGE_SIZE = 20;

export default function AdminUsers() {
  // -----------------------
  // Tabs
  // -----------------------
  const [tab, setTab] = useState<"users" | "invites">("users");

  // -----------------------
  // Roles (shared)
  // -----------------------
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // -----------------------
  // USERS state
  // -----------------------
  const [users, setUsers] = useState<UserListItemDTO[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("ALL");
  const [role, setRole] = useState<RoleName | "">("");
  const [page, setPage] = useState(1);

  const abortUsersRef = useRef<AbortController | null>(null);

  // -----------------------
  // INVITES state
  // -----------------------
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<{ message: string } | null>(null);

  const [invSearch, setInvSearch] = useState("");
  const [only, setOnly] = useState<InviteOnlyFilter | "">("");

  // create invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteDays, setInviteDays] = useState(7);
  const [inviteCreating, setInviteCreating] = useState(false);

  const abortInvRef = useRef<AbortController | null>(null);

  // -----------------------
  // Helpers
  // -----------------------
  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  // -----------------------
  // Load roles (once)
  // -----------------------
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setRolesLoading(true);
        const r = await adminUserService.listRoles({ signal: controller.signal });
        if (!mounted) return;
        setRoles(r);
        if (!inviteRoleId && r[0]?.id) setInviteRoleId(r[0].id);
      } catch {
        // se falhar roles, a tela ainda funciona (só não troca cargo / cria invite)
      } finally {
        if (mounted) setRolesLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // USERS: fetch
  // -----------------------
  async function fetchUsers(opts?: { resetPage?: boolean }) {
    const resetPage = opts?.resetPage ?? false;
    const nextPage = resetPage ? 1 : page;

    abortUsersRef.current?.abort();
    const controller = new AbortController();
    abortUsersRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const data: UsersListResponseDTO = await adminUserService.listUsers(
        {
          page: nextPage,
          pageSize: PAGE_SIZE,
          q: searchTerm.trim() || undefined,
          status,
          role: role || undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      setUsers(Array.isArray(data?.users) ? data.users : []);

      const m = data?.meta;
      const newMeta = m && typeof m === "object"
        ? {
            page: Number(m.page ?? nextPage),
            pageSize: Number(m.pageSize ?? PAGE_SIZE),
            total: Number(m.total ?? (data.users?.length ?? 0)),
            totalPages: Number(m.totalPages ?? 1),
          }
        : {
            page: nextPage,
            pageSize: PAGE_SIZE,
            total: data.users?.length ?? 0,
            totalPages: Math.max(1, Math.ceil((data.users?.length ?? 0) / PAGE_SIZE)),
          };

      setMeta(newMeta);

      if (resetPage) setPage(1);
      else if (nextPage > newMeta.totalPages) setPage(newMeta.totalPages);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "CanceledError" && !controller.signal.aborted) {
        setError({ message: (err as { message?: string })?.message ?? "Falha ao listar usuários." });
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "users") return;
    fetchUsers({ resetPage: true });
    return () => abortUsersRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "users") return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // -----------------------
  // INVITES: fetch
  // -----------------------
  async function fetchInvites() {
    abortInvRef.current?.abort();
    const controller = new AbortController();
    abortInvRef.current = controller;

    try {
      setInvLoading(true);
      setInvError(null);

      const list = await adminUserService.listInvites(
        {
          q: invSearch.trim() || undefined,
          only: only || undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;
      setInvites(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "CanceledError" && !controller.signal.aborted) {
        setInvError({ message: (err as { message?: string })?.message ?? "Falha ao listar convites." });
      }
    } finally {
      if (!controller.signal.aborted) setInvLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "invites") return;
    fetchInvites();
    return () => abortInvRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, only]);

  // -----------------------
  // Actions: Users
  // -----------------------
  async function toggleUserStatus(u: UserListItemDTO) {
    try {
      const next: UserStatus = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      await adminUserService.updateUserStatus(u.id, next);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? "Não foi possível alterar o status.");
    }
  }

  async function changeUserRole(userId: string, roleId: string) {
    try {
      await adminUserService.updateUserRole(userId, roleId);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? "Não foi possível alterar o cargo.");
    }
  }

  // -----------------------
  // Actions: Invites
  // -----------------------
  async function createInvite() {
    if (!inviteEmail.trim()) return alert("Informe um email.");
    if (!inviteRoleId) return alert("Selecione um cargo.");

    try {
      setInviteCreating(true);
      const result = await adminUserService.createInvite({
        email: inviteEmail.trim(),
        roleId: inviteRoleId,
        expiresInDays: inviteDays,
      });
      setInviteEmail("");
      fetchInvites();

      const baseMsg = result.message || result.mensagem || "Convite criado com sucesso!";
      if (result.emailSent === false) {
        const warn = result.emailWarning ?? "O envio por e-mail falhou.";
        const reason = result.emailError ? `\nDetalhe técnico: ${result.emailError}` : "";
        const fallback = result.inviteLink ? `\nLink de fallback: ${result.inviteLink}` : "";
        alert(`${baseMsg}\n${warn}${reason}${fallback}`);
      } else {
        alert(baseMsg);
      }
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? "Falha ao criar convite.");
    } finally {
      setInviteCreating(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!window.confirm("Deseja revogar este convite?")) return;
    try {
      await adminUserService.revokeInvite(id);
      fetchInvites();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? "Falha ao revogar convite.");
    }
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-regif-blue" /> Gerenciar Usuários
          </h1>
          <p className="text-gray-500 text-sm">
            Administre permissões (cargos), status de contas e convites.
          </p>
        </div>

        {/* Tabs as "actions" */}
        <div className="inline-flex rounded-2xl border bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={clsx(
              "px-4 py-2.5 text-sm font-black transition",
              tab === "users" ? "bg-regif-blue text-white" : "hover:bg-slate-50 text-slate-800"
            )}
          >
            Usuários
          </button>
          <button
            type="button"
            onClick={() => setTab("invites")}
            className={clsx(
              "px-4 py-2.5 text-sm font-black transition",
              tab === "invites" ? "bg-regif-blue text-white" : "hover:bg-slate-50 text-slate-800"
            )}
          >
            Convites
          </button>
        </div>
      </div>

      {tab === "users" ? (
        <UsersTabContent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          status={status}
          setStatus={setStatus}
          role={role}
          setRole={setRole}
          rolesLoading={rolesLoading}
          roles={roles}
          onRefresh={() => fetchUsers({ resetPage: true })}
          loading={loading}
          error={error}
          users={users}
          onToggleUserStatus={(u) => void toggleUserStatus(u)}
          onChangeUserRole={(userId, roleId) => void changeUserRole(userId, roleId)}
          page={meta.page}
          totalPages={meta.totalPages}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          rangeText={rangeText(meta)}
        />
      ) : (
        <InvitesTabContent
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRoleId={inviteRoleId}
          setInviteRoleId={setInviteRoleId}
          inviteDays={inviteDays}
          setInviteDays={setInviteDays}
          inviteCreating={inviteCreating}
          onCreateInvite={() => void createInvite()}
          rolesLoading={rolesLoading}
          roles={roles}
          invSearch={invSearch}
          setInvSearch={setInvSearch}
          only={only}
          setOnly={setOnly}
          onRefresh={() => void fetchInvites()}
          invLoading={invLoading}
          invError={invError}
          invites={invites}
          onRevokeInvite={(id) => void revokeInvite(id)}
        />
      )}
    </div>
  );
}
