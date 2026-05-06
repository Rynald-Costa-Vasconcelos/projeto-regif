// src/modules/auth/auth.service.ts
import { prisma } from "../../lib/prismaClient";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface SetupInput {
  name: string;
  email: string;
  password: string;
  setupToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface InviteAcceptInput {
  token: string;
  name: string;
  password: string;
}

export async function setupFirstAdmin({
  name,
  email,
  password,
  setupToken,
}: SetupInput) {
  const envToken = process.env.SETUP_TOKEN;

  if (!envToken || setupToken.trim() !== envToken.trim()) {
    throw new Error("SETUP_TOKEN inválido. Verifique o terminal do backend.");
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    throw new Error(
      "A role 'ADMIN' não existe no banco. Rode: npx prisma db seed"
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { roleId: adminRole.id },
  });
  if (existingAdmin) {
    throw new Error(
      "Configuração bloqueada: Já existe um administrador cadastrado."
    );
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });

  return { id: user.id, name: user.name, email: user.email, role: "ADMIN" };
}

export async function authenticate({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) throw new Error("Credenciais inválidas.");
  if (!user.passwordHash)
    throw new Error("Usuário convidado. Complete o cadastro pelo e-mail.");

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw new Error("Credenciais inválidas.");

  if (user.status !== "ACTIVE") throw new Error("Usuário inativo ou suspenso.");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado no servidor.");

  const remember = Boolean((arguments[0] as LoginInput | undefined)?.rememberMe);
  const expiresIn = remember ? "30d" : "7d";
  const token = jwt.sign({ userId: user.id, role: user.role.name }, secret, {
    expiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
  };
}

export async function verifyUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, status: true },
  });
}

export async function touchLastLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function getInviteDetails(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      used: true,
      expiresAt: true,
      role: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  if (!invite) {
    throw new Error("Convite inválido.");
  }

  if (invite.used) {
    throw new Error("Este convite já foi utilizado.");
  }

  if (invite.expiresAt <= new Date()) {
    throw new Error("Este convite expirou.");
  }

  return invite;
}

export async function acceptInvite({ token, name, password }: InviteAcceptInput) {
  const invite = await getInviteDetails(token);

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Já existe uma conta criada para este convite.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: name.trim(),
        email: invite.email,
        passwordHash,
        roleId: invite.role.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { used: true },
    });

    return created;
  });

  return { user };
}

/**
 * Opcional: mantém compatibilidade com o “formato antigo”
 * (se algum lugar ainda fazia authService.authenticate(...)).
 */
export const authService = {
  setupFirstAdmin,
  authenticate,
  verifyUserByEmail,
  touchLastLogin,
  getInviteDetails,
  acceptInvite,
};
