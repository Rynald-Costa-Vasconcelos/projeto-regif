import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../lib/prismaClient";

function resolveInviteBaseUrl() {
  const raw =
    process.env.INVITE_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    "http://localhost:5173";

  return raw.replace(/\/+$/, "");
}

function buildInviteLink(token: string) {
  return `${resolveInviteBaseUrl()}/invite/${encodeURIComponent(token)}`;
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function requiredParamString(value: unknown, field: string) {
  const v = firstString(value);
  if (!v) throw new Error(`Parâmetro obrigatório ausente: ${field}`);
  return v;
}

const ROLE_NAMES = ["ADMIN", "EDITOR", "VIEWER"] as const;
type RoleName = (typeof ROLE_NAMES)[number];

const USER_STATUSES = ["ACTIVE", "DISABLED", "PENDING"] as const;
type UserStatus = (typeof USER_STATUSES)[number];

function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const listUsersQuerySchema = z.object({
  status: z.preprocess(
    (v) => firstString(v)?.toUpperCase(),
    z
      .string()
      .optional()
      .refine(
        (v) => !v || v === "ALL" || (USER_STATUSES as readonly string[]).includes(v),
        { message: "status inválido" }
      )
  ),
  q: z.preprocess((v) => firstString(v)?.trim(), z.string().optional()),
  role: z.preprocess(
    (v) => firstString(v)?.toUpperCase(),
    z
      .string()
      .optional()
      .refine((v) => !v || isRoleName(v), { message: "role inválido" })
  ),
  page: z.preprocess(
    (v) => Number(firstString(v) ?? "1"),
    z.number().int().min(1, "page inválido")
  ),
  pageSize: z.preprocess(
    (v) => Number(firstString(v) ?? "20"),
    z.number().int().min(1).max(100, "pageSize inválido (1-100)")
  ),
});

const updateUserRoleSchema = z.object({
  roleId: z.string().min(1, "roleId é obrigatório"),
});

const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED", "PENDING"]),
});

const createInviteSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .transform((v) => v.toLowerCase().trim()),
  roleId: z.string().min(1, "roleId é obrigatório"),
  expiresInDays: z
    .preprocess((v) => (v === undefined ? 7 : Number(v)), z.number().int().min(1).max(30))
    .optional(),
});

export type ServiceError = {
  status: number;
  body: any;
};

function err(status: number, body: any): ServiceError {
  return { status, body };
}

export function parseListUsersQuery(raw: any) {
  const parsed = listUsersQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw err(400, { erro: "Parâmetros inválidos.", detalhes: parsed.error.flatten() });
  }
  return parsed.data;
}

export function parseUpdateUserRoleBody(raw: any) {
  const parsed = updateUserRoleSchema.safeParse(raw);
  if (!parsed.success) {
    throw err(400, { erro: "Dados inválidos.", detalhes: parsed.error.flatten() });
  }
  return parsed.data;
}

export function parseUpdateUserStatusBody(raw: any) {
  const parsed = updateUserStatusSchema.safeParse(raw);
  if (!parsed.success) {
    throw err(400, { erro: "Dados inválidos.", detalhes: parsed.error.flatten() });
  }
  return parsed.data;
}

export function parseCreateInviteBody(raw: any) {
  const parsed = createInviteSchema.safeParse(raw);
  if (!parsed.success) {
    throw err(400, { erro: "Dados inválidos.", detalhes: parsed.error.flatten() });
  }
  return parsed.data;
}

export function requireParamId(raw: any) {
  return requiredParamString(raw, "id");
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    where: { name: { in: ROLE_NAMES as unknown as string[] } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { roles };
}

export async function listUsers(args: {
  status?: string;
  q?: string;
  role?: string;
  page: number;
  pageSize: number;
}) {
  const { status, q, role, page, pageSize } = args;

  const where: any = {};

  if (status && status !== "ALL") {
    where.status = status as UserStatus;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = { name: role as RoleName };
  }

  const skip = (page - 1) * pageSize;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        mustResetPassword: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, color: true, isSystem: true },
        },
      },
    }),
  ]);

  return {
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    users,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      status: true,
      mustResetPassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { id: true, name: true, color: true, isSystem: true } },
      _count: {
        select: {
          posts: true,
          edits: true,
          uploadedDocuments: true,
          tempAssets: true,
        },
      },
    },
  });

  if (!user) {
    throw err(404, { erro: "Usuário não encontrado." });
  }

  return { user };
}

export async function updateUserRole(args: {
  requesterId: string;
  userId: string;
  roleId: string;
}) {
  if (args.userId === args.requesterId) {
    throw err(400, {
      erro: "Ação não permitida.",
      mensagem: "Você não pode alterar o seu próprio cargo.",
    });
  }

  const [targetUser, targetRole] = await Promise.all([
    prisma.user.findUnique({
      where: { id: args.userId },
      select: { id: true, roleId: true },
    }),
    prisma.role.findUnique({
      where: { id: args.roleId },
      select: { id: true, name: true },
    }),
  ]);

  if (!targetUser) throw err(404, { erro: "Usuário não encontrado." });
  if (!targetRole) throw err(404, { erro: "Cargo não encontrado." });

  if (!isRoleName(targetRole.name)) {
    throw err(400, {
      erro: "Cargo inválido para o painel.",
      mensagem: "Apenas ADMIN, EDITOR e VIEWER são permitidos.",
    });
  }

  const updated = await prisma.user.update({
    where: { id: args.userId },
    data: { roleId: args.roleId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: { select: { id: true, name: true, color: true } },
      updatedAt: true,
    },
  });

  return {
    mensagem: "Cargo atualizado com sucesso.",
    user: updated,
  };
}

export async function updateUserStatus(args: {
  requesterId: string;
  userId: string;
  status: "ACTIVE" | "DISABLED" | "PENDING";
}) {
  if (args.userId === args.requesterId && args.status !== "ACTIVE") {
    throw err(400, {
      erro: "Ação não permitida.",
      mensagem: "Você não pode desativar a sua própria conta.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { id: true, status: true },
  });

  if (!user) throw err(404, { erro: "Usuário não encontrado." });

  const updated = await prisma.user.update({
    where: { id: args.userId },
    data: { status: args.status },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      mustResetPassword: true,
      role: { select: { id: true, name: true, color: true } },
      updatedAt: true,
    },
  });

  return {
    mensagem:
      args.status === "DISABLED"
        ? "Usuário desativado com sucesso."
        : args.status === "ACTIVE"
        ? "Usuário reativado com sucesso."
        : "Status atualizado com sucesso.",
    user: updated,
  };
}

export async function createInvite(args: {
  requesterId: string;
  email: string;
  roleId: string;
  expiresInDays: number;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: args.email },
    select: { id: true },
  });
  if (existingUser) {
    throw err(400, {
      erro: "Email já cadastrado.",
      mensagem: "Já existe um usuário com este email.",
    });
  }

  const role = await prisma.role.findUnique({
    where: { id: args.roleId },
    select: { id: true, name: true },
  });
  if (!role) throw err(404, { erro: "Cargo não encontrado." });

  if (!isRoleName(role.name)) {
    throw err(400, {
      erro: "Cargo inválido para convite.",
      mensagem: "Apenas ADMIN, EDITOR e VIEWER são permitidos.",
    });
  }

  const activeInvite = await prisma.invite.findFirst({
    where: {
      email: args.email,
      used: false,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, expiresAt: true },
  });

  if (activeInvite) {
    throw err(400, {
      erro: "Convite já existe.",
      mensagem: "Já existe um convite ativo para este email.",
      invite: activeInvite,
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), args.expiresInDays);

  const invite = await prisma.invite.create({
    data: {
      email: args.email,
      token,
      roleId: args.roleId,
      expiresAt,
      used: false,
      createdBy: args.requesterId,
    },
    select: {
      id: true,
      email: true,
      used: true,
      expiresAt: true,
      createdAt: true,
      role: { select: { id: true, name: true, color: true } },
    },
  });

  const inviteLink = buildInviteLink(token);
  let emailSent = false;
  let emailWarning: string | undefined;
  let emailError: string | undefined;

  try {
    const { emailService } = await import("../../infra/email/email.service");
    await emailService.sendInvite({
      toEmail: args.email,
      inviteLink,
      roleName: role.name,
      expiresAt,
    });
    emailSent = true;
  } catch (error) {
    emailError = error instanceof Error ? error.message : "Falha desconhecida no envio de e-mail.";
    emailWarning =
      "Convite criado, mas não foi possível enviar o e-mail automaticamente. Configure SMTP e tente reenviar.";
  }

  return {
    mensagem: emailSent
      ? "Convite criado e enviado por e-mail com sucesso."
      : "Convite criado com sucesso.",
    invite,
    emailSent,
    emailWarning,
    emailError,
    inviteLink: emailSent ? undefined : inviteLink,
  };
}

export async function listInvites(args: { q?: string; only?: string }) {
  const q = (args.q ?? "").trim().toLowerCase();
  const only = (args.only ?? "").toLowerCase();

  const where: any = {};
  if (q) {
    where.email = { contains: q, mode: "insensitive" };
  }

  const invites = await prisma.invite.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      used: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
      role: { select: { id: true, name: true, color: true } },
    },
  });

  const now = new Date();
  const mapped = invites
    .map((i) => {
      const isExpired = i.expiresAt <= now;
      const isActive = !i.used && !isExpired;
      return { ...i, isExpired, isActive };
    })
    .filter((i) => {
      if (!only) return true;
      if (only === "active") return i.isActive;
      if (only === "expired") return i.isExpired && !i.used;
      if (only === "used") return i.used;
      return true;
    });

  return { invites: mapped };
}

export async function revokeInvite(id: string) {
  const invite = await prisma.invite.findUnique({
    where: { id },
    select: { id: true, used: true },
  });

  if (!invite) throw err(404, { erro: "Convite não encontrado." });

  if (invite.used) {
    throw err(400, {
      erro: "Não é possível revogar.",
      mensagem: "Este convite já foi utilizado.",
    });
  }

  await prisma.invite.delete({ where: { id } });

  return { mensagem: "Convite revogado com sucesso." };
}
