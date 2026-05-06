import type { Request, Response } from "express";
import { prisma } from "../../lib/prismaClient";

export const usersController = {
  async me(req: Request, res: Response) {
    if (!req.user?.userId) {
      return res.status(401).json({
        code: "unauthorized",
        message: "Token inválido ou ausente.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            color: true,
            isSystem: true,
            permissions: {
              select: {
                id: true,
                slug: true,
                description: true,
                module: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        code: "user_not_found",
        message: "Usuário não encontrado.",
      });
    }

    return res.json({ user });
  },
};
