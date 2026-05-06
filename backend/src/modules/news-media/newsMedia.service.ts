import path from "path";
import fs from "fs/promises";
import { prisma } from "../../lib/prismaClient";
import {
  DIR_COVERS,
  DIR_GALLERY,
  DIR_THUMBS,
  DIR_TMP_NEWS,
  URL_BASE,
  addHours,
  ensureDirs,
  ensureTmpDir,
  makeThumb,
  randomName,
  readImageMeta,
  safeUnlink,
  toWebpAndSave,
  urlToDiskPath,
} from "./newsMedia.files";

export type FieldError = {
  field: string;
  code: string;
  message: string;
  meta?: Record<string, any>;
};

export class ServiceError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(message: string, statusCode = 400, errors?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function ensureAuth(currentUserId?: string | null) {
  if (!currentUserId) {
    throw new ServiceError("Não autenticado", 401, [
      { field: "auth", code: "unauthorized", message: "Faça login para continuar." },
    ]);
  }
}

export async function tmpUploadCover(args: {
  currentUserId?: string | null;
  file?: Express.Multer.File;
}) {
  await ensureDirs();
  ensureAuth(args.currentUserId);

  const file = args.file;
  if (!file) {
    throw new ServiceError("Falha de validação", 400, [
      { field: "cover", code: "required", message: "Envie um arquivo no campo 'cover'." },
    ]);
  }

  const { width, height } = await readImageMeta(file.buffer);

  const minW = 1280;
  const minH = 720;

  if (width < minW || height < minH) {
    throw new ServiceError("Falha de validação", 400, [
      {
        field: "cover",
        code: "image_too_small",
        message: `Imagem muito pequena. Mínimo: ${minW}x${minH} (16:9). Atual: ${width}x${height}.`,
        meta: { minW, minH, width, height },
      },
    ]);
  }

  const now = new Date();
  const expiresAt = addHours(now, 2);

  const temp = await prisma.tempAsset.create({
    data: {
      ownerId: args.currentUserId!,
      kind: "NEWS_COVER",
      url: "",
      thumbUrl: null,
      relPath: "",
      mimeType: "image/webp",
      originalName: file.originalname ?? null,
      expiresAt,
    },
  });

  const tmpDir = await ensureTmpDir(temp.id);

  const name = "cover.webp";
  const coverDiskPath = path.join(tmpDir, name);
  const coverUrl = `${URL_BASE}/tmp/news/${temp.id}/${name}`;

  const thumbName = `thumb-cover.webp`;
  const thumbDiskPath = path.join(tmpDir, thumbName);
  const thumbUrl = `${URL_BASE}/tmp/news/${temp.id}/${thumbName}`;

  const saved = await toWebpAndSave(file.buffer, coverDiskPath);
  await makeThumb(file.buffer, thumbDiskPath);

  const relPath = `news/tmp/news/${temp.id}/${name}`;

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
    kind: "NEWS_COVER" as const,
    url: coverUrl,
    thumbUrl,
    width: saved.width,
    height: saved.height,
    sizeBytes: saved.sizeBytes,
    mimeType: saved.mimeType,
    expiresAt,
  };
}

export async function tmpUploadGallery(args: {
  currentUserId?: string | null;
  files?: Express.Multer.File[];
}) {
  await ensureDirs();
  ensureAuth(args.currentUserId);

  const files = args.files ?? [];
  if (!files.length) {
    throw new ServiceError("Falha de validação", 400, [
      { field: "images", code: "required", message: "Envie arquivos no campo 'images'." },
    ]);
  }

  const minW = 800;
  const minH = 450;

  const metas = await Promise.all(files.map((f) => readImageMeta(f.buffer)));
  const errors: FieldError[] = [];

  metas.forEach((m, idx) => {
    if (m.width < minW || m.height < minH) {
      errors.push({
        field: `gallery[${idx}]`,
        code: "image_too_small",
        message: `Imagem muito pequena. Mínimo: ${minW}x${minH}. Atual: ${m.width}x${m.height}.`,
        meta: { minW, minH, width: m.width, height: m.height },
      });
    }
  });

  if (errors.length) {
    throw new ServiceError("Uma ou mais imagens da galeria são inválidas", 400, errors);
  }

  const now = new Date();
  const expiresAt = addHours(now, 2);

  const items: any[] = [];
  const createdTempIds: string[] = [];
  const createdDirs: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const temp = await prisma.tempAsset.create({
        data: {
          ownerId: args.currentUserId!,
          kind: "NEWS_GALLERY",
          url: "",
          thumbUrl: null,
          relPath: "",
          mimeType: "image/webp",
          originalName: file.originalname ?? null,
          expiresAt,
        },
      });

      createdTempIds.push(temp.id);

      const tmpDir = await ensureTmpDir(temp.id);
      createdDirs.push(tmpDir);

      const name = "gallery.webp";
      const diskPath = path.join(tmpDir, name);
      const url = `${URL_BASE}/tmp/news/${temp.id}/${name}`;

      const thumbName = `thumb-gallery.webp`;
      const thumbDiskPath = path.join(tmpDir, thumbName);
      const thumbUrl = `${URL_BASE}/tmp/news/${temp.id}/${thumbName}`;

      const saved = await toWebpAndSave(file.buffer, diskPath);
      await makeThumb(file.buffer, thumbDiskPath);

      const relPath = `news/tmp/news/${temp.id}/${name}`;

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
        mimeType: saved.mimeType,
        expiresAt,
      });
    }
  } catch (err: any) {
    await Promise.all(
      createdDirs.map((d) => fs.rm(d, { recursive: true, force: true } as any).catch(() => {}))
    );
    await prisma.tempAsset
      .deleteMany({ where: { id: { in: createdTempIds }, ownerId: args.currentUserId! } })
      .catch(() => {});
    throw new ServiceError(err?.message ?? "Erro ao fazer upload temporário da galeria", 500);
  }

  return { kind: "NEWS_GALLERY" as const, items };
}

export async function deleteTmp(args: { currentUserId?: string | null; tmpId: string }) {
  ensureAuth(args.currentUserId);

  const tmpId = String(args.tmpId || "").trim();
  if (!tmpId) {
    throw new ServiceError("Falha de validação", 400, [
      { field: "tmpId", code: "required", message: "tmpId é obrigatório." },
    ]);
  }

  const temp = await prisma.tempAsset.findFirst({
    where: { id: tmpId, ownerId: args.currentUserId! },
  });

  if (!temp) {
    const dir = path.join(DIR_TMP_NEWS, tmpId);
    await fs.rm(dir, { recursive: true, force: true } as any).catch(() => {});
    return;
  }

  await prisma.tempAsset.delete({ where: { id: temp.id } });

  const dir = path.join(DIR_TMP_NEWS, tmpId);
  await fs.rm(dir, { recursive: true, force: true } as any).catch(() => {});
}

export async function uploadCover(args: { postId: string; file?: Express.Multer.File }) {
  await ensureDirs();

  const post = await prisma.newsPost.findUnique({
    where: { id: args.postId },
    include: { coverAsset: { select: { id: true, url: true, thumbUrl: true } } },
  });

  if (!post) throw new ServiceError("Notícia não encontrada", 404);

  const file = args.file;
  if (!file) throw new ServiceError("Envie um arquivo no campo 'cover'.", 400);

  const { width: w, height: h } = await readImageMeta(file.buffer);
  if (w < 1280 || h < 720)
    throw new ServiceError("Imagem muito pequena. Mínimo: 1280x720 (16:9).", 400);

  const name = randomName("webp");
  const coverDiskPath = path.join(DIR_COVERS, name);
  const coverUrl = `${URL_BASE}/covers/${name}`;

  const thumbName = `thumb-${name}`;
  const thumbDiskPath = path.join(DIR_THUMBS, thumbName);
  const thumbUrl = `${URL_BASE}/thumbs/${thumbName}`;

  const saved = await toWebpAndSave(file.buffer, coverDiskPath);
  await makeThumb(file.buffer, thumbDiskPath);

  const oldCoverDiskPath = urlToDiskPath(post.coverAsset?.url ?? null);
  const oldThumbDiskPath = urlToDiskPath(post.coverAsset?.thumbUrl ?? null);

  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.newsPost.findUnique({
      where: { id: args.postId },
      select: { coverAssetId: true },
    });

    let coverAssetId: string;

    if (previous?.coverAssetId) {
      const updatedAsset = await tx.newsAsset.update({
        where: { id: previous.coverAssetId },
        data: {
          type: "IMAGE",
          role: "COVER",
          url: coverUrl,
          thumbUrl,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          width: saved.width ?? undefined,
          height: saved.height ?? undefined,
          order: 0,
        },
      });
      coverAssetId = updatedAsset.id;
    } else {
      const newAsset = await tx.newsAsset.create({
        data: {
          postId: args.postId,
          type: "IMAGE",
          role: "COVER",
          url: coverUrl,
          thumbUrl,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          width: saved.width ?? undefined,
          height: saved.height ?? undefined,
          order: 0,
        },
      });

      coverAssetId = newAsset.id;

      await tx.newsPost.update({
        where: { id: args.postId },
        data: { coverAssetId },
      });
    }

    return tx.newsPost.findUnique({
      where: { id: args.postId },
      include: { coverAsset: true },
    });
  });

  if (oldCoverDiskPath && oldCoverDiskPath !== coverDiskPath) await safeUnlink(oldCoverDiskPath);
  if (oldThumbDiskPath && oldThumbDiskPath !== thumbDiskPath) await safeUnlink(oldThumbDiskPath);

  return result;
}

export async function uploadGallery(args: { postId: string; files?: Express.Multer.File[] }) {
  await ensureDirs();

  const post = await prisma.newsPost.findUnique({ where: { id: args.postId } });
  if (!post) throw new ServiceError("Notícia não encontrada", 404);
  if (!post.enableGallery) throw new ServiceError("Galeria está desativada para esta notícia.", 400);

  const files = args.files ?? [];
  if (!files.length) throw new ServiceError("Envie arquivos no campo 'images'.", 400);

  const last = await prisma.newsAsset.findFirst({
    where: { postId: args.postId, role: "GALLERY" },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  const created = await prisma.$transaction(async (tx) => {
    const assets = [];
    for (const file of files) {
      const { width: w, height: h } = await readImageMeta(file.buffer);
      if (w < 256 || h < 144) throw new Error("Uma das imagens é muito pequena. Mínimo: 256x144.");

      const name = randomName("webp");
      const diskPath = path.join(DIR_GALLERY, name);
      const url = `${URL_BASE}/gallery/${name}`;

      const thumbName = `thumb-${name}`;
      const thumbDiskPath = path.join(DIR_THUMBS, thumbName);
      const thumbUrl = `${URL_BASE}/thumbs/${thumbName}`;

      const saved = await toWebpAndSave(file.buffer, diskPath);
      await makeThumb(file.buffer, thumbDiskPath);

      const asset = await tx.newsAsset.create({
        data: {
          postId: args.postId,
          type: "IMAGE",
          role: "GALLERY",
          url,
          thumbUrl,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          width: saved.width ?? undefined,
          height: saved.height ?? undefined,
          order: nextOrder++,
        },
      });

      assets.push(asset);
    }
    return assets;
  });

  return created;
}

export async function deleteGalleryAsset(args: { postId: string; assetId: string }) {
  const asset = await prisma.newsAsset.findUnique({ where: { id: args.assetId } });
  if (!asset) throw new ServiceError("Imagem não encontrada", 404);

  if (asset.postId !== args.postId) throw new ServiceError("Esta imagem não pertence a esta notícia.", 403);
  if (asset.role !== "GALLERY") throw new ServiceError("Este asset não é da galeria.", 400);

  const diskPath = asset.url?.startsWith(URL_BASE)
    ? path.join(NEWS_UPLOAD_ROOT_FALLBACK(), asset.url.replace(URL_BASE + "/", ""))
    : null;

  const thumbDiskPath = asset.thumbUrl?.startsWith(URL_BASE)
    ? path.join(NEWS_UPLOAD_ROOT_FALLBACK(), asset.thumbUrl.replace(URL_BASE + "/", ""))
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.newsAsset.delete({ where: { id: args.assetId } });

    const remaining = await tx.newsAsset.findMany({
      where: { postId: args.postId, role: "GALLERY" },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < remaining.length; i++) {
      await tx.newsAsset.update({
        where: { id: remaining[i].id },
        data: { order: i },
      });
    }
  });

  if (diskPath) await safeUnlink(diskPath);
  if (thumbDiskPath) await safeUnlink(thumbDiskPath);
}

export async function deleteCover(args: { postId: string }) {
  const post = await prisma.newsPost.findUnique({
    where: { id: args.postId },
    select: { coverAssetId: true },
  });

  if (!post) throw new ServiceError("Notícia não encontrada", 404);
  if (!post.coverAssetId) return;

  const asset = await prisma.newsAsset.findUnique({ where: { id: post.coverAssetId } });
  if (!asset) {
    await prisma.newsPost.update({ where: { id: args.postId }, data: { coverAssetId: null } });
    return;
  }

  if (asset.role !== "COVER") throw new ServiceError("O asset vinculado não é uma capa.", 400);

  const diskPath = asset.url?.startsWith(URL_BASE)
    ? path.join(NEWS_UPLOAD_ROOT_FALLBACK(), asset.url.replace(URL_BASE + "/", ""))
    : null;

  const thumbDiskPath = asset.thumbUrl?.startsWith(URL_BASE)
    ? path.join(NEWS_UPLOAD_ROOT_FALLBACK(), asset.thumbUrl.replace(URL_BASE + "/", ""))
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.newsPost.update({ where: { id: args.postId }, data: { coverAssetId: null } });
    await tx.newsAsset.delete({ where: { id: asset.id } });
  });

  if (diskPath) await safeUnlink(diskPath);
  if (thumbDiskPath) await safeUnlink(thumbDiskPath);
}

export async function replaceLinks(args: {
  postId: string;
  links: { url: string; title?: string | null; description?: string | null }[];
}) {
  const post = await prisma.newsPost.findUnique({ where: { id: args.postId } });
  if (!post) throw new ServiceError("Notícia não encontrada", 404);
  if (!post.enableLinks) throw new ServiceError("Links estão desativados para esta notícia.", 400);

  const result = await prisma.$transaction(async (tx) => {
    await tx.newsLink.deleteMany({ where: { postId: args.postId } });

    if (args.links.length) {
      await tx.newsLink.createMany({
        data: args.links.map((l, idx) => ({
          postId: args.postId,
          url: l.url,
          title: l.title ?? null,
          description: l.description ?? null,
          order: idx,
        })),
      });
    }

    return tx.newsLink.findMany({ where: { postId: args.postId }, orderBy: { order: "asc" } });
  });

  return result;
}

function NEWS_UPLOAD_ROOT_FALLBACK() {
  return path.resolve(process.cwd(), "uploads", "news");
}
