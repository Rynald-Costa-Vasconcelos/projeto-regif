import type { Request, Response } from "express";

import {
  createCategorySchema,
  createDocumentSchema,
  updateCategorySchema,
  updateDocumentSchema,
  updateStatusSchema,
} from "./documents.schemas";

import * as documentsService from "./documents.service";
import { safeUnlinkDocumentFile } from "./documents.files";
import { AppError, fromZodError } from "../../core/http/errors";
import { asyncHandler } from "../../core/http/handlers";
import { sendData, sendList, sendNoContent } from "../../core/http/responses";

export const documentController = {
  // GET /documents/public
  listPublic: asyncHandler(async (req: Request, res: Response) => {
    const result = await documentsService.listPublic(req.query);
    return sendList(res, result.items, result.meta);
  }),

  // GET /documents/public/categories
  listPublicCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await documentsService.listPublicCategories();
    return sendList(res, result.items);
  }),

  // GET /documents/slug/:slug
  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const found = await documentsService.getBySlug(slug);
    if (!found) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    return sendData(res, found);
  }),

  // GET /documents/slug/:slug/download
  downloadBySlug: asyncHandler(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const result = await documentsService.downloadBySlug(slug);
    if (!result) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    return res.redirect(result.redirectTo);
  }),

  // GET /documents (admin)
  listAdmin: asyncHandler(async (req: Request, res: Response) => {
    const result = await documentsService.listAdmin(req.query);
    return sendList(res, result.items, result.meta);
  }),

  // GET /documents/:id
  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const doc = await documentsService.getById(id);
    if (!doc) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    return sendData(res, doc);
  }),

  // POST /documents (upload PDF)
  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = createDocumentSchema.safeParse(req.body);
    if (!validation.success) {
      throw fromZodError(validation.error);
    }

    const file = req.file;
    if (!file) {
      throw new AppError({
        code: "validation_error",
        statusCode: 400,
        message: "Arquivo PDF obrigatório (campo: file)",
      });
    }

    if (file.mimetype !== "application/pdf") {
      throw new AppError({
        code: "validation_error",
        statusCode: 400,
        message: "Apenas PDF é permitido",
      });
    }
    try {
      const currentUserId = req.user!.userId;
      const created = await documentsService.createDocument({
        data: validation.data,
        file,
        currentUserId,
        ipAddress: req.ip || "0.0.0.0",
      });
      return sendData(res, created, 201);
    } catch (error) {
      await safeUnlinkDocumentFile(req.file?.path);
      throw error;
    }
  }),

  // PATCH /documents/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const validation = updateDocumentSchema.safeParse(req.body);

    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const updated = await documentsService.updateDocument({
      id,
      data: validation.data,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!updated) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    return sendData(res, updated);
  }),

  // PATCH /documents/:id/status
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const validation = updateStatusSchema.safeParse(req.body);

    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const doc = await documentsService.updateDocumentStatus({
      id,
      status: validation.data.status,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!doc) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    return sendData(res, doc);
  }),

  // DELETE /documents/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    const currentUserId = req.user!.userId;
    const doc = await documentsService.deleteDocument({
      id,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!doc) {
      throw new AppError({
        code: "document_not_found",
        statusCode: 404,
        message: "Documento não encontrado",
      });
    }
    await safeUnlinkDocumentFile(doc.filePath);
    return sendNoContent(res);
  }),

  // ---------------- CATEGORIAS (ADMIN) ----------------

  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await documentsService.listCategoriesAdmin();
    return sendList(res, result.data);
  }),

  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const created = await documentsService.createCategory({
      data: validation.data,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    return sendData(res, created, 201);
  }),

  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const validation = updateCategorySchema.safeParse(req.body);

    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const updated = await documentsService.updateCategory({
      id,
      data: validation.data,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!updated) {
      throw new AppError({
        code: "document_category_not_found",
        statusCode: 404,
        message: "Categoria não encontrada",
      });
    }
    return sendData(res, updated);
  }),

  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const currentUserId = req.user!.userId;
    await documentsService.deleteCategory({
      id,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    return sendNoContent(res);
  }),
};
