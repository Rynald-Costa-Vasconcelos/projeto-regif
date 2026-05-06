import type { Request, Response } from "express";
import { z } from "zod";
import * as newsMediaService from "./newsMedia.service";
import type { FieldError } from "./newsMedia.service";

function badRequest(
  res: Response,
  errors: FieldError[],
  message = "Falha de validação"
) {
  return res.status(400).json({ message, errors });
}

export const newsMediaController = {
  async tmpUploadCover(req: Request, res: Response) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;

      const result = await newsMediaService.tmpUploadCover({
        currentUserId: req.user?.userId,
        file,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) {
        if (error?.errors?.length) return badRequest(res, error.errors, error.message);
        return res.status(error.statusCode).json({ message: error.message, errors: [] });
      }

      return res.status(500).json({
        message: "Erro ao fazer upload temporário da capa",
        errors: [
          {
            field: "cover",
            code: "server_error",
            message: error?.message ?? "Erro interno",
          },
        ],
      });
    }
  },

  async tmpUploadGallery(req: Request, res: Response) {
    try {
      const files = ((req as any).files ?? []) as Express.Multer.File[];

      const result = await newsMediaService.tmpUploadGallery({
        currentUserId: req.user?.userId,
        files,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) {
        if (error?.errors?.length) return badRequest(res, error.errors, error.message);
        return res.status(error.statusCode).json({ message: error.message, errors: [] });
      }

      return res.status(500).json({
        message: "Erro ao fazer upload temporário da galeria",
        errors: [
          {
            field: "images",
            code: "server_error",
            message: error?.message ?? "Erro interno",
          },
        ],
      });
    }
  },

  async deleteTmp(req: Request, res: Response) {
    const tmpId = String(req.params.tmpId || "").trim();

    try {
      await newsMediaService.deleteTmp({ currentUserId: req.user?.userId, tmpId });
      return res.status(204).send();
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) {
        if (error?.errors?.length) return badRequest(res, error.errors, error.message);
        return res.status(error.statusCode).json({ message: error.message, errors: [] });
      }

      return res.status(500).json({
        message: "Erro ao remover tmp",
        errors: [
          {
            field: "tmpId",
            code: "server_error",
            message: error?.message ?? "Erro interno",
          },
        ],
      });
    }
  },

  async uploadCover(req: Request, res: Response) {
    const postId = String(req.params.id);

    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const result = await newsMediaService.uploadCover({ postId, file });
      return res.json(result);
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) return res.status(error.statusCode).json({ erro: error.message });
      return res.status(500).json({ erro: error?.message ?? "Erro ao fazer upload da capa" });
    }
  },

  async uploadGallery(req: Request, res: Response) {
    const postId = String(req.params.id);

    try {
      const files = ((req as any).files ?? []) as Express.Multer.File[];
      const created = await newsMediaService.uploadGallery({ postId, files });
      return res.status(201).json(created);
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) return res.status(error.statusCode).json({ erro: error.message });
      return res.status(500).json({ erro: error?.message ?? "Erro ao fazer upload da galeria" });
    }
  },

  async deleteGalleryAsset(req: Request, res: Response) {
    const postId = String(req.params.id);
    const assetId = String(req.params.assetId);

    try {
      await newsMediaService.deleteGalleryAsset({ postId, assetId });
      return res.status(204).send();
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) return res.status(error.statusCode).json({ erro: error.message });
      return res.status(500).json({ erro: error?.message ?? "Erro ao remover imagem da galeria" });
    }
  },

  async deleteCover(req: Request, res: Response) {
    const postId = String(req.params.id);

    try {
      await newsMediaService.deleteCover({ postId });
      return res.status(204).send();
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) return res.status(error.statusCode).json({ erro: error.message });
      return res.status(500).json({ erro: error?.message ?? "Erro ao remover capa" });
    }
  },

  async replaceLinks(req: Request, res: Response) {
    const postId = String(req.params.id);

    const schema = z.object({
      links: z
        .array(
          z.object({
            url: z.string().url(),
            title: z.string().optional().nullable(),
            description: z.string().optional().nullable(),
          })
        )
        .max(30),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: parsed.error.format() });
    }

    try {
      const result = await newsMediaService.replaceLinks({ postId, links: parsed.data.links });
      return res.json(result);
    } catch (error: any) {
      console.error(error);

      if (error?.statusCode) return res.status(error.statusCode).json({ erro: error.message });
      return res.status(500).json({ erro: error?.message ?? "Erro ao salvar links" });
    }
  },
};
