import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  // 1) Header existe?
  if (!authorization) {
    return res.status(401).json({
      code: "auth_token_missing",
      message: "O acesso a este recurso requer autenticação.",
      details: null,
    });
  }

  // 2) Formato "Bearer <token>"
  const parts = authorization.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({
      code: "auth_token_malformed",
      message: "Token mal formatado.",
      details: null,
    });
  }

  const [schema, token] = parts;
  if (!/^Bearer$/i.test(schema)) {
    return res.status(401).json({
      code: "auth_token_malformed",
      message: "Token mal formatado.",
      details: null,
    });
  }

  // 3) Verifica token
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não configurado no servidor.");
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    // 4) Injeta userId + role
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      code: "auth_token_invalid",
      message: "Token inválido ou expirado. Faça login novamente para continuar.",
      details: null,
    });
  }
};
