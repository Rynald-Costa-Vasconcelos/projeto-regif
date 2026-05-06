import type { Request, Response } from "express";
import { createPostSchema, updatePostSchema } from "./news.schemas";
import * as newsService from "./news.service";
import { AppError, fromZodError } from "../../core/http/errors";
import { asyncHandler } from "../../core/http/handlers";
import { sendData, sendList, sendNoContent } from "../../core/http/responses";

export const newsController = {
  listAdmin: asyncHandler(async (req: Request, res: Response) => {
    const result = await newsService.listAdmin(req.query);
    return sendList(res, result.items, result.meta);
  }),

  listPublicCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await newsService.listPublicCategories();
    return sendList(res, result.items);
  }),

  listPublic: asyncHandler(async (req: Request, res: Response) => {
    const result = await newsService.listPublic(req.query);
    return sendList(res, result.items, result.meta);
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const post = await newsService.getBySlug(slug, req.ip || "0.0.0.0");
    if (!post) {
      throw new AppError({
        code: "news_not_found",
        statusCode: 404,
        message: "Notícia não encontrada",
      });
    }
    return sendData(res, post);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const post = await newsService.getById(id);
    if (!post) {
      throw new AppError({
        code: "news_not_found",
        statusCode: 404,
        message: "Notícia não encontrada",
      });
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    return sendData(res, post);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const validation = createPostSchema.safeParse(req.body);
    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const created = await newsService.create({
      data: validation.data,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    return sendData(res, created, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const validation = updatePostSchema.safeParse(req.body);
    if (!validation.success) {
      throw fromZodError(validation.error);
    }
    const currentUserId = req.user!.userId;
    const updated = await newsService.update({
      id,
      data: validation.data,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!updated) {
      throw new AppError({
        code: "news_not_found",
        statusCode: 404,
        message: "Notícia não encontrada",
      });
    }
    return sendData(res, updated);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { status } = req.body;
    const currentUserId = req.user!.userId;
    const post = await newsService.updateStatus({
      id,
      status,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    return sendData(res, post);
  }),

  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await newsService.listCategoriesAdmin();
    return sendList(res, result.data);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const currentUserId = req.user!.userId;
    const ok = await newsService.deletePost({
      id,
      currentUserId,
      ipAddress: req.ip || "0.0.0.0",
    });
    if (!ok) {
      throw new AppError({
        code: "news_not_found",
        statusCode: 404,
        message: "Notícia não encontrada",
      });
    }
    return sendNoContent(res);
  }),
};
