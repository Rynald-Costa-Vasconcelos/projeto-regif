import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type ShopGuestJwtPayload = {
  typ?: string;
  v?: number;
  email?: string;
  iat?: number;
  exp?: number;
};

/**
 * Bearer JWT emitido após verificação do código de e-mail (`typ: SHOP_GUEST_ORDERS`).
 */
export function shopGuestAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({
      code: "shop_guest_token_missing",
      message: "Informe o token de acesso aos pedidos.",
      details: null,
    });
  }
  const parts = authorization.split(" ");
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]!)) {
    return res.status(401).json({
      code: "shop_guest_token_malformed",
      message: "Token mal formatado.",
      details: null,
    });
  }
  const token = parts[1]!;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não configurado no servidor.");
    const decoded = jwt.verify(token, secret) as ShopGuestJwtPayload;
    if (decoded.typ !== "SHOP_GUEST_ORDERS" || typeof decoded.email !== "string" || !decoded.email) {
      return res.status(401).json({
        code: "shop_guest_token_invalid",
        message: "Token inválido para esta área.",
        details: null,
      });
    }
    req.shopGuestEmail = decoded.email;
    return next();
  } catch {
    return res.status(401).json({
      code: "shop_guest_token_invalid",
      message: "Sessão expirada ou inválida. Solicite um novo código pelo e-mail.",
      details: null,
    });
  }
}
