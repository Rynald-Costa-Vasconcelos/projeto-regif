import type { Request, Response } from "express";

import { asyncHandler } from "../../core/http/handlers";
import * as shopMediaService from "./shopMedia.service";

export const shopMediaController = {
  tmpUploadCover: asyncHandler(async (req: Request, res: Response) => {
    const file = (req as { file?: Express.Multer.File }).file;
    const result = await shopMediaService.tmpUploadShopCover({
      ownerId: req.user?.userId,
      file,
    });
    return res.status(201).json(result);
  }),

  tmpUploadGallery: asyncHandler(async (req: Request, res: Response) => {
    const files = (req as { files?: Express.Multer.File[] }).files ?? [];
    const result = await shopMediaService.tmpUploadShopGallery({
      ownerId: req.user?.userId,
      files,
    });
    return res.status(201).json(result);
  }),

  deleteTmp: asyncHandler(async (req: Request, res: Response) => {
    const tmpId = String(req.params.tmpId || "").trim();
    await shopMediaService.deleteShopTmp({ ownerId: req.user?.userId, tmpId });
    return res.status(204).send();
  }),
};
