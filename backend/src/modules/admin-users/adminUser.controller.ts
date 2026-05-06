import type { Request, Response } from "express";
import * as adminUserService from "./adminUser.service";

function requesterId(req: Request, res: Response) {
  const uid = req.user?.userId;
  if (!uid) {
    res.status(401).json({
      code: "auth_required",
      message: "Usuário não autenticado.",
      details: null,
    });
    return null;
  }
  return uid;
}

function normalizeServiceBody(body: any) {
  if (!body || typeof body !== "object") {
    return {
      code: "internal_error",
      message: "Erro interno.",
      details: null,
    };
  }

  const code =
    typeof body.code === "string"
      ? body.code
      : typeof body.erro === "string"
      ? body.erro.toLowerCase().replace(/\s+/g, "_")
      : "request_error";

  const message =
    (typeof body.message === "string" && body.message) ||
    (typeof body.mensagem === "string" && body.mensagem) ||
    (typeof body.erro === "string" && body.erro) ||
    "Falha na requisição.";

  const details =
    body.details ?? body.detalhes ?? (body.invite ? { invite: body.invite } : null);

  return { code, message, details };
}

function handleServiceError(res: Response, e: any) {
  if (e && typeof e === "object" && "status" in e && "body" in e) {
    const status = Number((e as any).status) || 500;
    return res.status(status).json(normalizeServiceBody((e as any).body));
  }
  return res.status(500).json({
    code: "internal_error",
    message: "Erro interno.",
    details: null,
  });
}

export const adminUserController = {
  async listRoles(_req: Request, res: Response) {
    try {
      const result = await adminUserService.listRoles();
      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async listUsers(req: Request, res: Response) {
    try {
      const q = adminUserService.parseListUsersQuery(req.query);
      const result = await adminUserService.listUsers(q);
      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const id = adminUserService.requireParamId(req.params.id);
      const result = await adminUserService.getUserById(id);
      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async updateUserRole(req: Request, res: Response) {
    const rid = requesterId(req, res);
    if (!rid) return;

    try {
      const userId = adminUserService.requireParamId(req.params.id);
      const body = adminUserService.parseUpdateUserRoleBody(req.body);

      const result = await adminUserService.updateUserRole({
        requesterId: rid,
        userId,
        roleId: body.roleId,
      });

      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async updateUserStatus(req: Request, res: Response) {
    const rid = requesterId(req, res);
    if (!rid) return;

    try {
      const userId = adminUserService.requireParamId(req.params.id);
      const body = adminUserService.parseUpdateUserStatusBody(req.body);

      const result = await adminUserService.updateUserStatus({
        requesterId: rid,
        userId,
        status: body.status,
      });

      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async createInvite(req: Request, res: Response) {
    const rid = requesterId(req, res);
    if (!rid) return;

    try {
      const body = adminUserService.parseCreateInviteBody(req.body);

      const result = await adminUserService.createInvite({
        requesterId: rid,
        email: body.email,
        roleId: body.roleId,
        expiresInDays: body.expiresInDays ?? 7,
      });

      return res.status(201).json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async listInvites(req: Request, res: Response) {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const only = typeof req.query.only === "string" ? req.query.only : undefined;

      const result = await adminUserService.listInvites({ q, only });
      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },

  async revokeInvite(req: Request, res: Response) {
    try {
      const id = adminUserService.requireParamId(req.params.id);
      const result = await adminUserService.revokeInvite(id);
      return res.json(result);
    } catch (e) {
      return handleServiceError(res, e);
    }
  },
};
