import path from "path";
import fs from "fs/promises";
import { prisma } from "../../../lib/prismaClient";
import { generateSlug } from "../../../utils/slugify";
import type { CreatePostInput, UpdatePostInput } from "../news.schemas";

import {
  absFromUploads,
  ensureNewsDirs,
  NEWS_DIR_COVERS,
  NEWS_DIR_GALLERY,
  NEWS_DIR_THUMBS,
  randomWebpName,
  safeRename,
  safeUnlink,
  toRelativeUploadsPath,
  URL_NEWS_BASE,
  UPLOADS_DIR,
} from "../news.files";

import { ServiceError, FieldError } from "./news.errors";

// ======================================================
// STATUS
// ======================================================

export async function updateStatus(args: {
  id: string;
  status: string;
  currentUserId: string;
  ipAddress: string;
}) {
  const post = await prisma.newsPost.update({
    where: { id: args.id },
    data: { status: args.status as any },
  });

  return post;
}

// ======================================================
// UPDATE
// ======================================================

export async function update(args: {
  id: string;
  data: UpdatePostInput;
  currentUserId: string;
  ipAddress: string;
}) {
  let nextSlug: string | undefined;

  if (typeof args.data.title === "string") {
    nextSlug = generateSlug(args.data.title);
    const existing = await prisma.newsPost.findUnique({
      where: { slug: nextSlug },
    });
    if (existing && existing.id !== args.id) {
      nextSlug = `${nextSlug}-${Date.now()}`;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.newsPost.findUnique({
      where: { id: args.id },
    });
    if (!before) return null;

    const shouldTouchLinks =
      typeof args.data.enableLinks !== "undefined" ||
      typeof args.data.links !== "undefined";

    const post = await tx.newsPost.update({
      where: { id: args.id },
      data: {
        ...(typeof args.data.title === "string"
          ? { title: args.data.title, slug: nextSlug }
          : {}),
        ...(args.data.excerpt !== undefined
          ? { excerpt: args.data.excerpt }
          : {}),
        ...(typeof args.data.contentHtml === "string"
          ? { contentHtml: args.data.contentHtml }
          : {}),
        ...(args.data.categoryId !== undefined
          ? { categoryId: args.data.categoryId }
          : {}),
        ...(args.data.status !== undefined
          ? { status: args.data.status as any }
          : {}),
        ...(args.data.isFeatured !== undefined
          ? { isFeatured: args.data.isFeatured }
          : {}),

        ...(args.data.showFeaturedImage !== undefined
          ? { showFeaturedImage: args.data.showFeaturedImage }
          : {}),
        ...(args.data.enableGallery !== undefined
          ? { enableGallery: args.data.enableGallery }
          : {}),
        ...(args.data.enableLinks !== undefined
          ? { enableLinks: args.data.enableLinks }
          : {}),

        ...(args.data.coverAssetId !== undefined
          ? { coverAssetId: args.data.coverAssetId }
          : {}),

        ...(shouldTouchLinks
          ? args.data.enableLinks === false
            ? { links: { deleteMany: {} } }
            : {
                links: {
                  deleteMany: {},
                  create: (args.data.links ?? []).map((l) => ({
                    url: l.url,
                    title: l.title ?? null,
                    description: l.description ?? null,
                    order: l.order,
                  })),
                },
              }
          : {}),
      },
      include: {
        coverAsset: true,
        links: { orderBy: { order: "asc" } },
      },
    });

    return post;
  });

  return updated;
}

// ======================================================
// CREATE
// ======================================================

export async function create(args: {
  data: CreatePostInput;
  currentUserId: string;
  ipAddress: string;
}) {
  const {
    title,
    excerpt,
    contentHtml,
    categoryId,
    status,
    isFeatured,
    showFeaturedImage,
    enableGallery,
    enableLinks,
    coverAssetId,
    links,
    coverTmpId,
    galleryTmpIds,
  } = args.data;

  const normalizedCategoryId = categoryId ?? undefined;
  const normalizedGalleryTmpIds = enableGallery ? galleryTmpIds ?? [] : [];
  const normalizedEnableGallery = normalizedGalleryTmpIds.length > 0;

  const coherenceErrors: FieldError[] = [];

  if (enableLinks === false && (links?.length ?? 0) > 0) {
    coherenceErrors.push({
      field: "links",
      code: "links_disabled",
      message: "Links estão desativados. Ative 'Links' para enviar links.",
    });
  }

  if (coherenceErrors.length) {
    throw new ServiceError("Corrija os campos destacados", 400, coherenceErrors);
  }

  let slug = generateSlug(title);
  const existing = await prisma.newsPost.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const wantsAtomic =
    Boolean(coverTmpId) || normalizedGalleryTmpIds.length > 0;

  // ======================
  // ATOMIC FLOW
  // ======================

  if (wantsAtomic) {
    await ensureNewsDirs();

    const now = new Date();
    const tempErrors: FieldError[] = [];

    let coverTmp: any = null;

    if (coverTmpId) {
      coverTmp = await prisma.tempAsset.findFirst({
        where: {
          id: coverTmpId,
          ownerId: args.currentUserId,
          kind: "NEWS_COVER",
          expiresAt: { gt: now },
        },
      });

      if (!coverTmp) {
        tempErrors.push({
          field: "cover",
          code: "tmp_not_found",
          message:
            "Capa temporária não encontrada, expirada ou não pertence ao usuário.",
        });
      }
    }

    const galleryTmps =
      normalizedGalleryTmpIds.length > 0
        ? await prisma.tempAsset.findMany({
            where: {
              id: { in: normalizedGalleryTmpIds },
              ownerId: args.currentUserId,
              kind: "NEWS_GALLERY",
              expiresAt: { gt: now },
            },
          })
        : [];

    if (normalizedGalleryTmpIds.length) {
      const foundIds = new Set(galleryTmps.map((t) => t.id));
      const missing = normalizedGalleryTmpIds.filter(
        (id) => !foundIds.has(id)
      );

      if (missing.length) {
        tempErrors.push({
          field: "gallery",
          code: "tmp_not_found",
          message:
            "Uma ou mais imagens temporárias da galeria não foram encontradas ou expiraram.",
          meta: { missing },
        });
      }
    }

    if (tempErrors.length) {
      throw new ServiceError("Arquivos temporários inválidos", 400, tempErrors);
    }

    // ======================
    // MOVE FILES
    // ======================

    const plannedMoves: any[] = [];

    if (coverTmp) {
      const from = absFromUploads(coverTmp.relPath);
      await fs.stat(from);

      const coverName = randomWebpName("cover");
      plannedMoves.push({
        from,
        to: path.join(NEWS_DIR_COVERS, coverName),
        url: `${URL_NEWS_BASE}/covers/${coverName}`,
        kind: "COVER",
        meta: coverTmp,
        tmpId: coverTmp.id,
      });
    }

    for (const tmp of galleryTmps) {
      const from = absFromUploads(tmp.relPath);
      await fs.stat(from);

      const name = randomWebpName("gallery");
      plannedMoves.push({
        from,
        to: path.join(NEWS_DIR_GALLERY, name),
        url: `${URL_NEWS_BASE}/gallery/${name}`,
        kind: "GALLERY",
        meta: tmp,
        tmpId: tmp.id,
      });
    }

    const moved: { from: string; to: string }[] = [];

    try {
      for (const m of plannedMoves) {
        await safeRename(m.from, m.to);
        moved.push({ from: m.from, to: m.to });
      }
    } catch (err: any) {
      await Promise.all(
        moved.map(({ from, to }) =>
          safeRename(to, from).catch(() => safeUnlink(to))
        )
      );
      throw new ServiceError(
        err?.message ?? "Erro ao mover arquivos",
        500
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const post = await tx.newsPost.create({
          data: {
            title,
            slug,
            excerpt,
            contentHtml,
            isFeatured,
            status: status as any,
            categoryId: normalizedCategoryId,
            authorId: args.currentUserId,
            showFeaturedImage,
            enableGallery: normalizedEnableGallery,
            enableLinks,
            ...(enableLinks
              ? {
                  links: {
                    create: (links ?? [])
                      .filter((l) => (l.url ?? "").trim().length > 0)
                      .map((l, idx) => ({
                        url: l.url.trim(),
                        title: (l.title ?? "").trim() || null,
                        description: (l.description ?? "").trim() || null,
                        order: idx,
                      })),
                  },
                }
              : {}),
          },
        });

        const coverMove = plannedMoves.find((m) => m.kind === "COVER");
        const galleryMoves = plannedMoves.filter((m) => m.kind === "GALLERY");

        let createdCoverAssetId: string | null = null;

        if (coverMove) {
          const coverAsset = await tx.newsAsset.create({
            data: {
              postId: post.id,
              type: "IMAGE",
              role: "COVER",
              url: coverMove.url,
              order: 0,
            },
          });
          createdCoverAssetId = coverAsset.id;
        }

        for (let idx = 0; idx < galleryMoves.length; idx += 1) {
          const m = galleryMoves[idx];
          await tx.newsAsset.create({
            data: {
              postId: post.id,
              type: "IMAGE",
              role: "GALLERY",
              url: m.url,
              order: idx,
            },
          });
        }

        if (createdCoverAssetId) {
          await tx.newsPost.update({
            where: { id: post.id },
            data: { coverAssetId: createdCoverAssetId },
          });
        }

        return post;
      });

      return result;
    } catch (err: any) {
      await Promise.all(
        moved.map(({ from, to }) =>
          safeRename(to, from).catch(() => safeUnlink(to))
        )
      );
      throw new ServiceError(err?.message ?? "Erro ao criar notícia", 500);
    }
  }

  // ======================
  // LEGADO
  // ======================

  const post = await prisma.newsPost.create({
    data: {
      title,
      slug,
      excerpt,
      contentHtml,
      isFeatured,
      status: status as any,
      categoryId: normalizedCategoryId,
      authorId: args.currentUserId,
      showFeaturedImage,
      enableGallery: normalizedEnableGallery,
      enableLinks,
      coverAssetId: coverAssetId ?? null,
      ...(enableLinks
        ? {
            links: {
              create: (links ?? [])
                .filter((l) => (l.url ?? "").trim().length > 0)
                .map((l, idx) => ({
                  url: l.url.trim(),
                  title: (l.title ?? "").trim() || null,
                  description: (l.description ?? "").trim() || null,
                  order: idx,
                })),
            },
          }
        : {}),
    },
  });

  return post;
}

// ======================================================
// DELETE
// ======================================================

export async function deletePost(args: {
  id: string;
  currentUserId: string;
  ipAddress: string;
}) {
  const postWithAssets = await prisma.newsPost.findUnique({
    where: { id: args.id },
    include: {
      coverAsset: true,
      assets: true,
    },
  });

  if (!postWithAssets) return null;

  await prisma.newsPost.delete({ where: { id: args.id } });

  const urls = [
    postWithAssets.coverAsset?.url,
    postWithAssets.coverAsset?.thumbUrl,
    ...(postWithAssets.assets ?? []).flatMap((a) => [a.url, a.thumbUrl]),
  ].filter(Boolean) as string[];

  await Promise.all(
    urls.map((u) => {
      const rel = toRelativeUploadsPath(u);
      return rel
        ? safeUnlink(path.resolve(UPLOADS_DIR, rel))
        : Promise.resolve();
    })
  );

  return true;
}
