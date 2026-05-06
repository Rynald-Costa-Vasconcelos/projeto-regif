import type { Request, Response } from "express";

import { AppError, fromZodError } from "../../core/http/errors";
import { asyncHandler } from "../../core/http/handlers";
import { sendData, sendList } from "../../core/http/responses";
import {
  createPublicShopOrderSchema,
  createShopProductSchema,
  guestOrderRequestCodeSchema,
  guestOrderVerifyCodeSchema,
  updateShopOrderStatusSchema,
  updateShopProductSchema,
} from "./shop.schemas";
import * as shopService from "./shop.service";

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

const shopAdminRoles = ["ADMIN", "EDITOR"] as const;

export const shopController = {
  listPublicCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await shopService.listPublicCategories();
    return sendList(res, result.items);
  }),

  listPublicProducts: asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.listPublicProducts(req.query);
    return sendList(res, result.items, result.meta);
  }),

  listPublicFeatured: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit;
    const result = await shopService.listPublicFeatured(
      limit != null ? Number(limit) : undefined
    );
    return sendList(res, result.items);
  }),

  getPublicProductBySlug: asyncHandler(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const found = await shopService.getPublicProductBySlug(slug);
    if (!found) {
      throw new AppError({
        code: "shop_product_not_found",
        statusCode: 404,
        message: "Produto não encontrado.",
      });
    }
    return sendData(res, found);
  }),

  createPublicOrder: asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPublicShopOrderSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);

    const customerUserId = req.user?.userId ?? null;
    const created = await shopService.createPublicOrder(parsed.data, customerUserId);
    return sendData(res, created, 201);
  }),

  listAdminCategories: asyncHandler(async (_req: Request, res: Response) => {
    const result = await shopService.listAdminCategories();
    return sendList(res, result.items);
  }),

  listAdminProducts: asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.listAdminProducts(req.query);
    return sendList(res, result.items, result.meta);
  }),

  createAdminProduct: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;

    const parsed = createShopProductSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);
    const created = await shopService.createAdminProduct(uid, parsed.data);
    return sendData(res, created, 201);
  }),

  getAdminProduct: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const row = await shopService.getAdminProduct(id);
    if (!row) {
      throw new AppError({ code: "shop_product_not_found", statusCode: 404, message: "Produto não encontrado." });
    }
    return sendData(res, row);
  }),

  updateAdminProduct: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;

    const parsed = updateShopProductSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);
    const id = String(req.params.id);
    const updated = await shopService.updateAdminProduct(uid, id, parsed.data);
    return sendData(res, updated);
  }),

  deleteAdminProduct: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const result = await shopService.deleteAdminProduct(id);
    return sendData(res, result);
  }),

  listAdminOrders: asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.listAdminOrders(req.query);
    return sendList(res, result.items, result.meta);
  }),

  getAdminOrder: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const row = await shopService.getAdminOrder(id);
    if (!row) {
      throw new AppError({ code: "shop_order_not_found", statusCode: 404, message: "Pedido não encontrado." });
    }
    return sendData(res, row);
  }),

  updateAdminOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const uid = requesterId(req, res);
    if (!uid) return;

    const parsed = updateShopOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);
    const id = String(req.params.id);
    const updated = await shopService.updateAdminOrderStatus(id, parsed.data, uid);
    return sendData(res, updated);
  }),

  requestGuestShopOrderCode: asyncHandler(async (req: Request, res: Response) => {
    const parsed = guestOrderRequestCodeSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);
    const out = await shopService.requestGuestShopOrderAccessCode(parsed.data.email);
    return sendData(res, out);
  }),

  verifyGuestShopOrderCode: asyncHandler(async (req: Request, res: Response) => {
    const parsed = guestOrderVerifyCodeSchema.safeParse(req.body);
    if (!parsed.success) throw fromZodError(parsed.error);
    const out = await shopService.verifyGuestShopOrderAccessCode(parsed.data.email, parsed.data.code);
    return sendData(res, out);
  }),

  listGuestShopOrders: asyncHandler(async (req: Request, res: Response) => {
    const email = req.shopGuestEmail;
    if (!email) {
      throw new AppError({
        code: "shop_guest_token_missing",
        statusCode: 401,
        message: "Sessão de pedidos não encontrada.",
      });
    }
    const items = await shopService.listGuestShopOrdersForEmail(email);
    return sendList(res, items);
  }),

  getGuestShopOrder: asyncHandler(async (req: Request, res: Response) => {
    const email = req.shopGuestEmail;
    if (!email) {
      throw new AppError({
        code: "shop_guest_token_missing",
        statusCode: 401,
        message: "Sessão de pedidos não encontrada.",
      });
    }
    const id = String(req.params.id);
    const row = await shopService.getGuestShopOrderForEmail(id, email);
    if (!row) {
      throw new AppError({ code: "shop_order_not_found", statusCode: 404, message: "Pedido não encontrado." });
    }
    return sendData(res, row);
  }),
};

export { shopAdminRoles };
