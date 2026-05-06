import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./auth.service";
import { AppError, fromZodError } from "../../core/http/errors";
import { asyncHandler, parseBody } from "../../core/http/handlers";

const passwordRegex = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .regex(/[A-Z]/, "Maiúscula necessária")
  .regex(/[a-z]/, "Minúscula necessária")
  .regex(/[0-9]/, "Número necessário")
  .regex(/[\W_]/, "Especial necessário");

const setupSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: passwordRegex,
  setupToken: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

const verifyEmailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

function paramAsString(raw: unknown) {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}

const inviteAcceptSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  password: passwordRegex,
});

export const authController = {
  verifyUser: asyncHandler(async (req: Request, res: Response) => {
    const { email } = parseBody(verifyEmailSchema, req);
    const user = await authService.verifyUserByEmail(email);

    if (!user) {
      throw new AppError({
        code: "user_not_found",
        statusCode: 404,
        message: "Este e-mail não está cadastrado.",
      });
    }

    return res.json({ exists: true, name: user.name, status: user.status });
  }),

  setup: asyncHandler(async (req: Request, res: Response) => {
    const validation = setupSchema.safeParse(req.body);
    if (!validation.success) throw fromZodError(validation.error);

    try {
      const user = await authService.setupFirstAdmin(validation.data);
      return res
        .status(201)
        .json({ message: "Primeiro administrador criado com sucesso!", user });
    } catch (error: any) {
      if (
        error?.message?.includes("SETUP_TOKEN") ||
        error?.message?.includes("bloqueada")
      ) {
        throw new AppError({
          code: "setup_forbidden",
          statusCode: 403,
          message: error.message,
        });
      }
      throw error;
    }
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = parseBody(loginSchema, req);
    const normalizedEmail = email.toLowerCase().trim();

    const knownUser = await authService.verifyUserByEmail(normalizedEmail);
    if (knownUser && knownUser.status !== "ACTIVE") {
      const reason =
        knownUser.status === "DISABLED"
          ? "Sua conta foi desativada."
          : "Sua conta ainda está pendente de ativação.";

      throw new AppError({
        code: "inactive_user",
        statusCode: 403,
        message: `${reason} Entre em contato com um administrador.`,
        details: { status: knownUser.status },
      });
    }

    try {
      const result = await authService.authenticate({
        email: normalizedEmail,
        password,
        rememberMe: Boolean(rememberMe),
      });

      const userId = (result as any)?.user?.id as string | undefined;
      if (userId) {
        await authService.touchLastLogin(userId);
      }

      return res.json({
        message: "Login realizado com sucesso",
        token: result.token,
        user: result.user,
      });
    } catch (error: any) {
      if (error?.message === "Credenciais inválidas.") {
        throw new AppError({
          code: "invalid_credentials",
          statusCode: 401,
          message: "Senha incorreta.",
        });
      }
      throw error;
    }
  }),

  getInviteDetails: asyncHandler(async (req: Request, res: Response) => {
    const token = paramAsString(req.params.token).trim();
    if (!token) {
      throw new AppError({
        code: "invite_token_required",
        statusCode: 400,
        message: "Token do convite é obrigatório.",
      });
    }

    try {
      const invite = await authService.getInviteDetails(token);
      return res.json({ invite });
    } catch (error: any) {
      const message = error?.message || "Convite inválido.";
      const statusCode = message.includes("expirou") ? 410 : 404;
      throw new AppError({
        code: "invite_invalid",
        statusCode,
        message,
      });
    }
  }),

  acceptInvite: asyncHandler(async (req: Request, res: Response) => {
    const token = paramAsString(req.params.token).trim();
    if (!token) {
      throw new AppError({
        code: "invite_token_required",
        statusCode: 400,
        message: "Token do convite é obrigatório.",
      });
    }

    const validation = inviteAcceptSchema.safeParse(req.body);
    if (!validation.success) throw fromZodError(validation.error);

    try {
      const result = await authService.acceptInvite({
        token,
        name: validation.data.name,
        password: validation.data.password,
      });

      return res.status(201).json({
        message: "Cadastro concluído com sucesso. Agora você já pode fazer login.",
        user: result.user,
      });
    } catch (error: any) {
      const message = error?.message || "Não foi possível concluir o cadastro.";
      const statusCode =
        message.includes("expirou") ? 410 : message.includes("Já existe uma conta") ? 409 : 400;

      throw new AppError({
        code: "invite_accept_failed",
        statusCode,
        message,
      });
    }
  }),
};
