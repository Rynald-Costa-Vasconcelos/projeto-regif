import path from "path";
import fs from "fs/promises";

import { prisma } from "../../lib/prismaClient";
import { AppError } from "../../core/http/errors";
import { absFromUploads, safeRename, safeUnlink, toRelativeUploadsPath } from "../news/news.files";
import {
  DIR_SHOP_COVERS,
  DIR_SHOP_GALLERY,
  DIR_SHOP_THUMBS,
  ensureShopMediaDirs,
  randomShopWebpName,
  URL_SHOP_BASE,
} from "./shopMedia.files";

export type CommittedShopImageRow = {
  url: string;
  thumbUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  alt: string | null;
};

type MovePair = { from: string; to: string };

function thumbPathBesideMain(mainAbs: string, thumbFileName: string) {
  return path.join(path.dirname(mainAbs), thumbFileName);
}

async function statOrThrow(abs: string, label: string) {
  try {
    await fs.stat(abs);
  } catch {
    throw new AppError({
      code: "shop_tmp_file_missing",
      statusCode: 400,
      message: `Arquivo temporário da lojinha não encontrado (${label}). Faça upload novamente.`,
    });
  }
}

export async function commitShopImagesFromTemps(args: {
  ownerId: string;
  coverTmpId: string;
  galleryTmpIds: string[];
}): Promise<{ rows: CommittedShopImageRow[]; tmpIds: string[]; moved: MovePair[] }> {
  await ensureShopMediaDirs();
  const now = new Date();

  const coverTmp = await prisma.tempAsset.findFirst({
    where: {
      id: args.coverTmpId,
      ownerId: args.ownerId,
      kind: "SHOP_COVER",
      expiresAt: { gt: now },
    },
  });
  if (!coverTmp?.relPath) {
    throw new AppError({
      code: "shop_tmp_cover_invalid",
      statusCode: 400,
      message: "Capa temporária inválida, expirada ou não pertence ao seu usuário.",
    });
  }

  const galleryTmps =
    args.galleryTmpIds.length > 0
      ? await prisma.tempAsset.findMany({
          where: {
            id: { in: args.galleryTmpIds },
            ownerId: args.ownerId,
            kind: "SHOP_GALLERY",
            expiresAt: { gt: now },
          },
        })
      : [];

  if (args.galleryTmpIds.length) {
    const found = new Set(galleryTmps.map((t) => t.id));
    const missing = args.galleryTmpIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new AppError({
        code: "shop_tmp_gallery_invalid",
        statusCode: 400,
        message: "Uma ou mais imagens da galeria temporária não foram encontradas ou expiraram.",
        details: { missing },
      });
    }
  }

  const planned: Array<{
    from: string;
    to: string;
    thumbFrom: string;
    thumbTo: string;
    url: string;
    thumbUrl: string;
    isPrimary: boolean;
    sortOrder: number;
  }> = [];

  const mainCoverAbs = absFromUploads(coverTmp.relPath);
  await statOrThrow(mainCoverAbs, "capa");
  const thumbCoverFrom = thumbPathBesideMain(mainCoverAbs, "thumb-cover.webp");
  await statOrThrow(thumbCoverFrom, "miniatura da capa");

  const coverName = randomShopWebpName("cover");
  const coverTo = path.join(DIR_SHOP_COVERS, coverName);
  const thumbCoverName = `thumb-${coverName}`;
  const thumbCoverTo = path.join(DIR_SHOP_THUMBS, thumbCoverName);

  planned.push({
    from: mainCoverAbs,
    to: coverTo,
    thumbFrom: thumbCoverFrom,
    thumbTo: thumbCoverTo,
    url: `${URL_SHOP_BASE}/covers/${coverName}`,
    thumbUrl: `${URL_SHOP_BASE}/thumbs/${thumbCoverName}`,
    isPrimary: true,
    sortOrder: 0,
  });

  for (let i = 0; i < galleryTmps.length; i++) {
    const g = galleryTmps[i]!;
    const mainAbs = absFromUploads(g.relPath);
    await statOrThrow(mainAbs, "galeria");
    const thumbFrom = thumbPathBesideMain(mainAbs, "thumb-gallery.webp");
    await statOrThrow(thumbFrom, "miniatura da galeria");

    const gName = randomShopWebpName("gallery");
    const gTo = path.join(DIR_SHOP_GALLERY, gName);
    const thumbName = `thumb-${gName}`;
    const thumbTo = path.join(DIR_SHOP_THUMBS, thumbName);

    planned.push({
      from: mainAbs,
      to: gTo,
      thumbFrom,
      thumbTo,
      url: `${URL_SHOP_BASE}/gallery/${gName}`,
      thumbUrl: `${URL_SHOP_BASE}/thumbs/${thumbName}`,
      isPrimary: false,
      sortOrder: i + 1,
    });
  }

  const moved: MovePair[] = [];

  try {
    for (const p of planned) {
      await safeRename(p.from, p.to);
      moved.push({ from: p.from, to: p.to });
      await safeRename(p.thumbFrom, p.thumbTo);
      moved.push({ from: p.thumbFrom, to: p.thumbTo });
    }
  } catch (err: unknown) {
    await rollbackShopMoves(moved);
    throw err;
  }

  const rows: CommittedShopImageRow[] = planned.map((p) => ({
    url: p.url,
    thumbUrl: p.thumbUrl,
    isPrimary: p.isPrimary,
    sortOrder: p.sortOrder,
    alt: null,
  }));

  const tmpIds = [coverTmp.id, ...galleryTmps.map((g) => g.id)];

  return { rows, tmpIds, moved };
}

export async function rollbackShopMoves(moved: MovePair[]) {
  for (const { from, to } of [...moved].reverse()) {
    await safeRename(to, from).catch(() => safeUnlink(to));
  }
}

export async function appendGalleryFromTemps(args: {
  ownerId: string;
  galleryTmpIds: string[];
  startSortOrder: number;
}): Promise<{ rows: CommittedShopImageRow[]; tmpIds: string[]; moved: MovePair[] }> {
  await ensureShopMediaDirs();
  const now = new Date();

  const galleryTmps = await prisma.tempAsset.findMany({
    where: {
      id: { in: args.galleryTmpIds },
      ownerId: args.ownerId,
      kind: "SHOP_GALLERY",
      expiresAt: { gt: now },
    },
  });

  if (args.galleryTmpIds.length) {
    const found = new Set(galleryTmps.map((t) => t.id));
    const missing = args.galleryTmpIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new AppError({
        code: "shop_tmp_gallery_invalid",
        statusCode: 400,
        message: "Uma ou mais imagens da galeria temporária não foram encontradas ou expiraram.",
        details: { missing },
      });
    }
  }

  const planned: Array<{
    from: string;
    to: string;
    thumbFrom: string;
    thumbTo: string;
    url: string;
    thumbUrl: string;
    sortOrder: number;
  }> = [];

  for (let i = 0; i < galleryTmps.length; i++) {
    const g = galleryTmps[i]!;
    const mainAbs = absFromUploads(g.relPath);
    await statOrThrow(mainAbs, "galeria");
    const thumbFrom = thumbPathBesideMain(mainAbs, "thumb-gallery.webp");
    await statOrThrow(thumbFrom, "miniatura da galeria");

    const gName = randomShopWebpName("gallery");
    const gTo = path.join(DIR_SHOP_GALLERY, gName);
    const thumbName = `thumb-${gName}`;
    const thumbTo = path.join(DIR_SHOP_THUMBS, thumbName);

    planned.push({
      from: mainAbs,
      to: gTo,
      thumbFrom,
      thumbTo,
      url: `${URL_SHOP_BASE}/gallery/${gName}`,
      thumbUrl: `${URL_SHOP_BASE}/thumbs/${thumbName}`,
      sortOrder: args.startSortOrder + i,
    });
  }

  const moved: MovePair[] = [];
  try {
    for (const p of planned) {
      await safeRename(p.from, p.to);
      moved.push({ from: p.from, to: p.to });
      await safeRename(p.thumbFrom, p.thumbTo);
      moved.push({ from: p.thumbFrom, to: p.thumbTo });
    }
  } catch (err: unknown) {
    await rollbackShopMoves(moved);
    throw err;
  }

  const rows: CommittedShopImageRow[] = planned.map((p) => ({
    url: p.url,
    thumbUrl: p.thumbUrl,
    isPrimary: false,
    sortOrder: p.sortOrder,
    alt: null,
  }));

  return { rows, tmpIds: galleryTmps.map((g) => g.id), moved };
}

export async function commitCoverReplaceFromTmp(args: {
  ownerId: string;
  coverTmpId: string;
}): Promise<{ row: CommittedShopImageRow; tmpId: string; moved: MovePair[] }> {
  await ensureShopMediaDirs();
  const now = new Date();

  const coverTmp = await prisma.tempAsset.findFirst({
    where: {
      id: args.coverTmpId,
      ownerId: args.ownerId,
      kind: "SHOP_COVER",
      expiresAt: { gt: now },
    },
  });
  if (!coverTmp?.relPath) {
    throw new AppError({
      code: "shop_tmp_cover_invalid",
      statusCode: 400,
      message: "Capa temporária inválida, expirada ou não pertence ao seu usuário.",
    });
  }

  const mainCoverAbs = absFromUploads(coverTmp.relPath);
  await statOrThrow(mainCoverAbs, "capa");
  const thumbCoverFrom = thumbPathBesideMain(mainCoverAbs, "thumb-cover.webp");
  await statOrThrow(thumbCoverFrom, "miniatura da capa");

  const coverName = randomShopWebpName("cover");
  const coverTo = path.join(DIR_SHOP_COVERS, coverName);
  const thumbCoverName = `thumb-${coverName}`;
  const thumbCoverTo = path.join(DIR_SHOP_THUMBS, thumbCoverName);

  const moved: MovePair[] = [];
  try {
    await safeRename(mainCoverAbs, coverTo);
    moved.push({ from: mainCoverAbs, to: coverTo });
    await safeRename(thumbCoverFrom, thumbCoverTo);
    moved.push({ from: thumbCoverFrom, to: thumbCoverTo });
  } catch (err: unknown) {
    await rollbackShopMoves(moved);
    throw err;
  }

  const row: CommittedShopImageRow = {
    url: `${URL_SHOP_BASE}/covers/${coverName}`,
    thumbUrl: `${URL_SHOP_BASE}/thumbs/${thumbCoverName}`,
    isPrimary: true,
    sortOrder: 0,
    alt: null,
  };

  return { row, tmpId: coverTmp.id, moved };
}

export function unlinkShopImageUrls(url: string | null | undefined, thumbUrl: string | null | undefined) {
  const r1 = url ? toRelativeUploadsPath(url) : null;
  const r2 = thumbUrl ? toRelativeUploadsPath(thumbUrl) : null;
  if (r1?.startsWith("shop/")) void safeUnlink(absFromUploads(r1));
  if (r2?.startsWith("shop/")) void safeUnlink(absFromUploads(r2));
}
