import path from "path";
import fs from "fs/promises";

import { prisma } from "../../lib/prismaClient";
import { AppError } from "../../core/http/errors";
import {
  addHours,
  DIR_TMP_SHOP,
  ensureShopMediaDirs,
  ensureShopTmpDir,
  makeSquareThumb,
  randomShopWebpName,
  readImageMeta,
  SHOP_COVER_SIZE,
  SHOP_THUMB_SIZE,
  toSquareWebpAndSave,
  URL_SHOP_BASE,
} from "./shopMedia.files";

const MIN_UPLOAD_PX = 400;

function assertAuth(ownerId?: string | null) {
  if (!ownerId) {
    throw new AppError({
      code: "auth_required",
      statusCode: 401,
      message: "Faça login para enviar imagens.",
    });
  }
}

export async function tmpUploadShopCover(args: { ownerId?: string | null; file?: Express.Multer.File }) {
  await ensureShopMediaDirs();
  assertAuth(args.ownerId);

  const file = args.file;
  if (!file) {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: "Envie um arquivo no campo 'cover'.",
    });
  }

  const { width, height } = await readImageMeta(file.buffer);
  if (width < MIN_UPLOAD_PX || height < MIN_UPLOAD_PX) {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: `Imagem muito pequena. Mínimo: ${MIN_UPLOAD_PX}×${MIN_UPLOAD_PX}px (após o recorte). Atual: ${width}×${height}.`,
    });
  }

  const now = new Date();
  const expiresAt = addHours(now, 2);

  const temp = await prisma.tempAsset.create({
    data: {
      ownerId: args.ownerId!,
      kind: "SHOP_COVER",
      url: "",
      thumbUrl: null,
      relPath: "",
      mimeType: "image/webp",
      originalName: file.originalname ?? null,
      expiresAt,
    },
  });

  const tmpDir = await ensureShopTmpDir(temp.id);
  const name = "cover.webp";
  const coverDiskPath = path.join(tmpDir, name);
  const coverUrl = `${URL_SHOP_BASE}/tmp/shop/${temp.id}/${name}`;
  const thumbName = "thumb-cover.webp";
  const thumbDiskPath = path.join(tmpDir, thumbName);
  const thumbUrl = `${URL_SHOP_BASE}/tmp/shop/${temp.id}/${thumbName}`;

  const saved = await toSquareWebpAndSave(file.buffer, coverDiskPath, SHOP_COVER_SIZE);
  await makeSquareThumb(file.buffer, thumbDiskPath, SHOP_THUMB_SIZE);

  const relPath = `shop/tmp/shop/${temp.id}/${name}`;

  await prisma.tempAsset.update({
    where: { id: temp.id },
    data: {
      url: coverUrl,
      thumbUrl,
      relPath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      width: saved.width ?? undefined,
      height: saved.height ?? undefined,
    },
  });

  return {
    tmpId: temp.id,
    kind: "SHOP_COVER" as const,
    url: coverUrl,
    thumbUrl,
    width: saved.width,
    height: saved.height,
    sizeBytes: saved.sizeBytes,
    expiresAt,
  };
}

export async function tmpUploadShopGallery(args: { ownerId?: string | null; files?: Express.Multer.File[] }) {
  await ensureShopMediaDirs();
  assertAuth(args.ownerId);

  const files = args.files ?? [];
  if (!files.length) {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: "Envie arquivos no campo 'images'.",
    });
  }

  for (const f of files) {
    const { width, height } = await readImageMeta(f.buffer);
    if (width < MIN_UPLOAD_PX || height < MIN_UPLOAD_PX) {
      throw new AppError({
        code: "validation_error",
        statusCode: 400,
        message: `Uma das imagens é menor que ${MIN_UPLOAD_PX}×${MIN_UPLOAD_PX}px.`,
      });
    }
  }

  const now = new Date();
  const expiresAt = addHours(now, 2);
  const items: Array<{
    tmpId: string;
    url: string;
    thumbUrl: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    expiresAt: Date;
  }> = [];

  const createdTempIds: string[] = [];
  const createdDirs: string[] = [];

  try {
    for (const file of files) {
      const temp = await prisma.tempAsset.create({
        data: {
          ownerId: args.ownerId!,
          kind: "SHOP_GALLERY",
          url: "",
          thumbUrl: null,
          relPath: "",
          mimeType: "image/webp",
          originalName: file.originalname ?? null,
          expiresAt,
        },
      });
      createdTempIds.push(temp.id);

      const tmpDir = await ensureShopTmpDir(temp.id);
      createdDirs.push(tmpDir);

      const name = "gallery.webp";
      const diskPath = path.join(tmpDir, name);
      const url = `${URL_SHOP_BASE}/tmp/shop/${temp.id}/${name}`;
      const thumbName = "thumb-gallery.webp";
      const thumbDiskPath = path.join(tmpDir, thumbName);
      const thumbUrl = `${URL_SHOP_BASE}/tmp/shop/${temp.id}/${thumbName}`;

      const saved = await toSquareWebpAndSave(file.buffer, diskPath, SHOP_COVER_SIZE);
      await makeSquareThumb(file.buffer, thumbDiskPath, SHOP_THUMB_SIZE);

      const relPath = `shop/tmp/shop/${temp.id}/${name}`;

      await prisma.tempAsset.update({
        where: { id: temp.id },
        data: {
          url,
          thumbUrl,
          relPath,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          width: saved.width ?? undefined,
          height: saved.height ?? undefined,
        },
      });

      items.push({
        tmpId: temp.id,
        url,
        thumbUrl,
        width: saved.width,
        height: saved.height,
        sizeBytes: saved.sizeBytes,
        expiresAt,
      });
    }
  } catch (err: unknown) {
    await Promise.all(createdDirs.map((d) => fs.rm(d, { recursive: true, force: true }).catch(() => {})));
    await prisma.tempAsset.deleteMany({ where: { id: { in: createdTempIds }, ownerId: args.ownerId! } }).catch(() => {});
    throw err;
  }

  return { kind: "SHOP_GALLERY" as const, items };
}

/** Após commit bem-sucedido no disco + DB: remove linhas e pastas temporárias. */
export async function cleanupShopTempAssets(tmpIds: string[]) {
  const uniq = [...new Set(tmpIds.filter(Boolean))];
  if (!uniq.length) return;
  await prisma.tempAsset.deleteMany({ where: { id: { in: uniq } } });
  await Promise.all(
    uniq.map((id) => fs.rm(path.join(DIR_TMP_SHOP, id), { recursive: true, force: true }).catch(() => {}))
  );
}

export async function deleteShopTmp(args: { ownerId?: string | null; tmpId: string }) {
  assertAuth(args.ownerId);
  const tmpId = String(args.tmpId || "").trim();
  if (!tmpId) {
    throw new AppError({ code: "validation_error", statusCode: 400, message: "tmpId é obrigatório." });
  }

  const temp = await prisma.tempAsset.findFirst({
    where: {
      id: tmpId,
      ownerId: args.ownerId!,
      kind: { in: ["SHOP_COVER", "SHOP_GALLERY"] },
    },
  });

  if (!temp) {
    await fs.rm(path.join(DIR_TMP_SHOP, tmpId), { recursive: true, force: true }).catch(() => {});
    return;
  }

  await prisma.tempAsset.delete({ where: { id: temp.id } });
  await fs.rm(path.join(DIR_TMP_SHOP, tmpId), { recursive: true, force: true }).catch(() => {});
}
