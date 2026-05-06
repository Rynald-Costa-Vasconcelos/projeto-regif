import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { TokenPayload } from "./authMiddleware";

/**
 * Se houver Bearer válido, preenche `req.user`; caso contrário segue sem autenticação.
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization) return next();

  const parts = authorization.split(" ");
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]!)) return next();

  const token = parts[1]!;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();
    const decoded = jwt.verify(token, secret) as TokenPayload & { typ?: string };
    // Ignora JWTs que não são de usuário do painel (ex.: acesso “Meus pedidos” da lojinha).
    if (typeof decoded.userId !== "string" || typeof decoded.role !== "string") return next();
    if (!decoded.userId || !decoded.role) return next();
    req.user = { userId: decoded.userId, role: decoded.role };
  } catch {
    // token inválido: trata como visitante
  }
  return next();
}
