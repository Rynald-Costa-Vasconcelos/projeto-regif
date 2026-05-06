import clsx from "clsx";
import type { InviteDTO, UserStatus } from "../../../services/adminUserService";

export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Ativo", cls: "bg-green-100 text-green-700" },
    DISABLED: { label: "Desativado", cls: "bg-gray-100 text-gray-700" },
    PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  };
  const item = map[status];
  return <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", item.cls)}>{item.label}</span>;
}

export function InviteStatusBadge({ invite }: { invite: InviteDTO }) {
  const isUsed = invite.used;
  const isExpired = !!invite.isExpired;
  const isActive = !!invite.isActive;

  const item = isUsed
    ? { label: "Usado", cls: "bg-gray-100 text-gray-700" }
    : isExpired
      ? { label: "Expirado", cls: "bg-amber-100 text-amber-700" }
      : isActive
        ? { label: "Ativo", cls: "bg-green-100 text-green-700" }
        : { label: "—", cls: "bg-gray-100 text-gray-700" };

  return <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", item.cls)}>{item.label}</span>;
}
