// src/services/adminUserService.ts
import type { AxiosRequestConfig } from "axios";
import { api } from "../lib/api";
import {
  toApiError,
  type PaginationMeta,
} from "../shared/api/contracts";
export type { ApiError } from "../shared/api/contracts";

// ===========================
// Tipos básicos do módulo
// ===========================

export type RoleName = "ADMIN" | "EDITOR" | "VIEWER";
export type UserStatus = "ACTIVE" | "DISABLED" | "PENDING";
export type UserStatusFilter = UserStatus | "ALL";

export type RoleDTO = {
  id: string;
  name: RoleName;
  description?: string | null;
  color: string;
  isSystem: boolean;
};

export type PermissionDTO = {
  id: string;
  slug: string;
  description: string;
  module: string;
};

export type UserListItemDTO = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  status: UserStatus;
  mustResetPassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  role: Pick<RoleDTO, "id" | "name" | "color" | "isSystem">;
};

export type UsersListResponseDTO = {
  meta: PaginationMeta;
  users: UserListItemDTO[];
};

export type UserDetailDTO = UserListItemDTO & {
  _count?: {
    posts?: number;
    edits?: number;
    uploadedDocuments?: number;
    tempAssets?: number;
  };
};

export type InviteDTO = {
  id: string;
  email: string;
  role: Pick<RoleDTO, "id" | "name" | "color" | "isSystem">;
  used: boolean;
  usedAt?: string | null;
  expiresAt: string;
  createdAt: string;

  // flags que o backend já retorna no listInvites:
  isActive?: boolean;
  isExpired?: boolean;
};

export type InviteOnlyFilter = "active" | "expired" | "used";

export type InvitesListResponseDTO = {
  invites: InviteDTO[];
};

export type MeResponseDTO = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    status: UserStatus;
    role: RoleDTO & {
      permissions: PermissionDTO[];
    };
  };
};

// ===========================
// Params (query/body)
// ===========================

export type ListUsersParams = {
  status?: UserStatusFilter; // ACTIVE|DISABLED|PENDING|ALL
  q?: string;
  role?: RoleName; // ADMIN|EDITOR|VIEWER
  page?: number;
  pageSize?: number;
};

export type ListInvitesParams = {
  q?: string;
  only?: InviteOnlyFilter; // active|expired|used
};

export type UpdateUserRoleBody = {
  roleId: string;
};

export type UpdateUserStatusBody = {
  status: UserStatus;
};

export type CreateInviteBody = {
  email: string;
  roleId: string;
  expiresInDays?: number;
};

export type CreateInviteResponseDTO = {
  mensagem?: string;
  message?: string;
  invite: InviteDTO;
  emailSent?: boolean;
  emailWarning?: string;
  emailError?: string;
  inviteLink?: string;
};

// ===========================
// Erro normalizado (robusto)
// ===========================

// helpers pra UI
export function isForbidden(e: unknown) {
  const x = toApiError(e);
  return x.status === 401 || x.status === 403;
}
export function isNotFound(e: unknown) {
  const x = toApiError(e);
  return x.status === 404;
}

// ===========================
// Utils: querystring e guards
// ===========================

function requireId(id: string, label = "id") {
  if (!id || typeof id !== "string") throw new Error(`${label} inválido`);
  return id;
}

function assertRoleName(x: string): asserts x is RoleName {
  if (x !== "ADMIN" && x !== "EDITOR" && x !== "VIEWER") {
    throw new Error("Role inválida (esperado ADMIN | EDITOR | VIEWER)");
  }
}

function assertUserStatus(x: string): asserts x is UserStatus {
  if (x !== "ACTIVE" && x !== "DISABLED" && x !== "PENDING") {
    throw new Error("Status inválido (esperado ACTIVE | DISABLED | PENDING)");
  }
}

/** NOVO: trim seguro (pra usar na tela também) */
export function safeTrim(v?: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : undefined;
}

function buildParams(obj: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    params.set(k, String(v));
  });
  return params;
}

/** NOVO: timeout padrão como no teu NewsList */
const REQUEST_TIMEOUT_MS = 10000;

/** NOVO: cfg centraliza signal + timeout + extras */
function cfg(signal?: AbortSignal, config?: AxiosRequestConfig) {
  return { timeout: REQUEST_TIMEOUT_MS, ...(config ?? {}), signal };
}

/** NOVO: rangeText exportável (igual teu padrão) */
export function rangeText(meta: PaginationMeta) {
  const total = meta.total ?? 0;
  if (!total) return "0 resultados";
  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, total);
  return `${start}-${end} de ${total}`;
}

// ===========================
// Service (funções do módulo)
// ===========================

export const adminUserService = {
  // ------------- Roles -------------
  async listRoles(opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }) {
    try {
      const res = await api.get<{ roles: RoleDTO[] }>(
        "/admin/roles",
        cfg(opts?.signal, opts?.config)
      );

      const roles = (res.data.roles ?? []).filter((r) => {
        try {
          assertRoleName(r.name);
          return true;
        } catch {
          return false;
        }
      });

      return roles;
    } catch (e) {
      throw toApiError(e, "Falha ao carregar cargos");
    }
  },

  // ------------- Users -------------
  async listUsers(
    params?: ListUsersParams,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const p = buildParams({
        status: params?.status,
        q: safeTrim(params?.q),
        role: params?.role,
        page: params?.page,
        pageSize: params?.pageSize,
      });

      const url = `/admin/users${p.toString() ? `?${p.toString()}` : ""}`;

      const res = await api.get<UsersListResponseDTO>(url, cfg(opts?.signal, opts?.config));
      return res.data;
    } catch (e) {
      throw toApiError(e, "Falha ao listar usuários");
    }
  },

  async getUserById(
    id: string,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const userId = requireId(id, "userId");
      const res = await api.get<{ user: UserDetailDTO }>(
        `/admin/users/${encodeURIComponent(userId)}`,
        cfg(opts?.signal, opts?.config)
      );
      return res.data.user;
    } catch (e) {
      throw toApiError(e, "Falha ao carregar usuário");
    }
  },

  async updateUserRole(
    id: string,
    roleId: string,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const userId = requireId(id, "userId");
      const body: UpdateUserRoleBody = { roleId: requireId(roleId, "roleId") };

      const res = await api.patch<{ user: UserDetailDTO }>(
        `/admin/users/${encodeURIComponent(userId)}/role`,
        body,
        cfg(opts?.signal, opts?.config)
      );
      return res.data.user;
    } catch (e) {
      throw toApiError(e, "Falha ao alterar cargo");
    }
  },

  async updateUserStatus(
    id: string,
    status: UserStatus,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const userId = requireId(id, "userId");
      assertUserStatus(status);
      const body: UpdateUserStatusBody = { status };

      const res = await api.patch<{ user: UserDetailDTO }>(
        `/admin/users/${encodeURIComponent(userId)}/status`,
        body,
        cfg(opts?.signal, opts?.config)
      );
      return res.data.user;
    } catch (e) {
      throw toApiError(e, "Falha ao alterar status do usuário");
    }
  },

  // ------------- Invites -------------
  async createInvite(
    payload: CreateInviteBody,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const body: CreateInviteBody = {
        email: (payload.email ?? "").trim(),
        roleId: requireId(payload.roleId, "roleId"),
        ...(payload.expiresInDays !== undefined ? { expiresInDays: payload.expiresInDays } : {}),
      };

      const res = await api.post<CreateInviteResponseDTO>(
        "/admin/invites",
        body,
        cfg(opts?.signal, opts?.config)
      );
      return res.data;
    } catch (e) {
      throw toApiError(e, "Falha ao criar convite");
    }
  },

  async listInvites(
    params?: ListInvitesParams,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const p = buildParams({
        q: safeTrim(params?.q),
        only: params?.only,
      });
      const url = `/admin/invites${p.toString() ? `?${p.toString()}` : ""}`;

      const res = await api.get<InvitesListResponseDTO>(url, cfg(opts?.signal, opts?.config));
      return res.data.invites ?? [];
    } catch (e) {
      throw toApiError(e, "Falha ao listar convites");
    }
  },

  async revokeInvite(
    id: string,
    opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }
  ) {
    try {
      const inviteId = requireId(id, "inviteId");
      await api.delete(
        `/admin/invites/${encodeURIComponent(inviteId)}`,
        cfg(opts?.signal, opts?.config)
      );
      return true;
    } catch (e) {
      throw toApiError(e, "Falha ao revogar convite");
    }
  },

  // ------------- Extras úteis -------------
  async getMe(opts?: { signal?: AbortSignal; config?: AxiosRequestConfig }) {
    try {
      const res = await api.get<MeResponseDTO>("/users/me", cfg(opts?.signal, opts?.config));
      return res.data;
    } catch (e) {
      throw toApiError(e, "Falha ao carregar usuário logado");
    }
  },
};
