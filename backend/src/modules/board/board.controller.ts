import type { Request, Response } from "express";

import { AppError } from "../../core/http/errors";
import { asyncHandler, parseBody } from "../../core/http/handlers";
import { sendData, sendList } from "../../core/http/responses";
import {
  assignBoardRoleSchema,
  createBoardMemberSchema,
  declareVacancySchema,
  listPublicBoardSchema,
  updateBoardMandateSchema,
  updateBoardMemberSchema,
} from "./board.schemas";
import * as boardService from "./board.service";
import { addBoardSseClient, removeBoardSseClient } from "./board.sse";

function requesterId(req: Request, res: Response): string | null {
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

export const boardController = {
  // ---------- Public ----------
  listPublic: asyncHandler(async (req: Request, res: Response) => {
    const parsed = listPublicBoardSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError({ code: "validation_error", statusCode: 400, message: "Parâmetros inválidos.", details: parsed.error.issues });
    const out = await boardService.listPublicBoard(parsed.data);
    return sendData(res, out);
  }),

  sse: asyncHandler(async (req: Request, res: Response) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // Nginx: evita buffer (se houver)
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    addBoardSseClient(id, res);

    res.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    req.on("close", () => {
      removeBoardSseClient(id);
    });
  }),

  // ---------- Admin ----------
  listRoles: asyncHandler(async (_req: Request, res: Response) => {
    const out = await boardService.listBoardRoles();
    return sendList(res, out.items);
  }),

  listMembers: asyncHandler(async (req: Request, res: Response) => {
    const out = await boardService.listMembers(req.query);
    return sendList(res, out.items);
  }),

  createMember: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;
    const body = parseBody(createBoardMemberSchema, req);
    const created = await boardService.createMember(uid, body as any);
    return sendData(res, created, 201);
  }),

  updateMember: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;
    const id = String(req.params.id);
    const body = parseBody(updateBoardMemberSchema, req);
    const updated = await boardService.updateMember(uid, id, body as any);
    return sendData(res, updated);
  }),

  /** Garante um mandato vigente no banco (cria padrão se necessário). */
  getCurrentMandate: asyncHandler(async (_req: Request, res: Response) => {
    const m = await boardService.getCurrentResolvedMandate();
    return sendData(res, m);
  }),

  updateMandate: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;
    const id = String(req.params.id);
    const body = parseBody(updateBoardMandateSchema, req);
    const updated = await boardService.updateMandate(uid, id, body);
    return sendData(res, updated);
  }),

  getAdminSnapshot: asyncHandler(async (_req: Request, res: Response) => {
    const out = await boardService.getAdminSnapshot();
    return sendData(res, out);
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;
    const body = parseBody(assignBoardRoleSchema, req);
    const out = await boardService.assignRole(uid, {
      mandateId: (req.query.mandateId ? String(req.query.mandateId) : null) ?? null,
      roleId: body.roleId,
      memberId: body.memberId ?? null,
      campus: body.campus ?? null,
      assignedAt: body.assignedAt ?? null,
    });
    return sendData(res, out);
  }),

  declareVacancy: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;
    const body = parseBody(declareVacancySchema, req);
    const roleId = String(req.params.roleId);
    const out = await boardService.declareVacancy(uid, {
      mandateId: (req.query.mandateId ? String(req.query.mandateId) : null) ?? null,
      roleId,
      reason: body.reason,
      note: body.note ?? null,
      portariaNumber: body.portariaNumber ?? null,
    });
    return sendData(res, out);
  }),

  vacancyAlerts: asyncHandler(async (req: Request, res: Response) => {
    const out = await boardService.listVacancyAlerts(req.query);
    return sendData(res, out);
  }),
};

