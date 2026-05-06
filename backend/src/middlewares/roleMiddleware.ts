import { Request, Response, NextFunction } from "express";

// Recebe uma lista de cargos permitidos (ex: ["ADMIN", "EDITOR"])
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Se o authMiddleware não tiver rodado antes, isso vai falhar
    if (!req.user) {
      return res.status(401).json({
        code: "auth_required",
        message: "Usuário não autenticado.",
        details: null,
      });
    }

    // Verifica se o cargo do usuário está na lista de permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: "forbidden_role",
        message: `O seu cargo (${req.user.role}) não tem permissão para acessar este recurso.`,
        details: {
          role: req.user.role,
          allowedRoles,
        },
      });
    }

    return next();
  };
};