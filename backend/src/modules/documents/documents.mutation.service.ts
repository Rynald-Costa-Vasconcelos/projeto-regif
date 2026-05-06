import { prisma } from "../../lib/prismaClient";
import { generateSlug } from "../../utils/slugify";
import { buildFileUrlFromAbsolutePath } from "./documents.files";
import type { CreateDocumentInput, UpdateDocumentInput } from "./documents.schemas";

export async function createDocument(args: {
  data: CreateDocumentInput;
  file: Express.Multer.File;
  currentUserId: string;
  ipAddress: string;
}) {
  let slug = generateSlug(args.data.title);
  const existing = await prisma.document.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const filePathAbs = args.file.path;
  const fileUrl = buildFileUrlFromAbsolutePath(filePathAbs);
  const nextStatus = args.data.status ?? "PUBLISHED";
  const publishedAt = nextStatus === "PUBLISHED" ? new Date() : null;

  return prisma.document.create({
    data: {
      title: args.data.title,
      slug,
      description: args.data.description ?? null,
      categoryId: args.data.categoryId ?? null,
      status: nextStatus as any,
      publishedAt,
      fileUrl,
      filePath: filePathAbs,
      mimeType: args.file.mimetype,
      originalName: args.file.originalname,
      sizeBytes: args.file.size,
      uploadedById: args.currentUserId,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateDocument(args: {
  id: string;
  data: UpdateDocumentInput;
  currentUserId: string;
  ipAddress: string;
}) {
  if (args.data.categoryId !== undefined && args.data.categoryId !== null) {
    const cat = await prisma.documentCategory.findUnique({ where: { id: args.data.categoryId } });
    if (!cat) {
      const e: any = new Error("Categoria inválida");
      e.statusCode = 400;
      throw e;
    }
  }

  let nextSlug: string | undefined;
  if (typeof args.data.title === "string") {
    nextSlug = generateSlug(args.data.title);
    const existing = await prisma.document.findUnique({ where: { slug: nextSlug } });
    if (existing && existing.id !== args.id) nextSlug = `${nextSlug}-${Date.now()}`;
  }

  const before = await prisma.document.findUnique({ where: { id: args.id } });
  if (!before) return null;

  const nextStatus = args.data.status ?? before.status;
  const nextPublishedAt = nextStatus === "PUBLISHED" ? (before.publishedAt ?? new Date()) : null;

  return prisma.document.update({
    where: { id: args.id },
    data: {
      ...(typeof args.data.title === "string" ? { title: args.data.title, slug: nextSlug } : {}),
      ...(args.data.description !== undefined ? { description: args.data.description } : {}),
      ...(args.data.categoryId !== undefined ? { categoryId: args.data.categoryId } : {}),
      ...(args.data.status !== undefined
        ? { status: args.data.status as any, publishedAt: nextPublishedAt }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateDocumentStatus(args: {
  id: string;
  status: "PUBLISHED" | "HIDDEN" | "ARCHIVED";
  currentUserId: string;
  ipAddress: string;
}) {
  const before = await prisma.document.findUnique({ where: { id: args.id } });
  if (!before) return null;

  const nextPublishedAt = args.status === "PUBLISHED" ? (before.publishedAt ?? new Date()) : null;

  return prisma.document.update({
    where: { id: args.id },
    data: { status: args.status as any, publishedAt: nextPublishedAt },
  });
}

export async function deleteDocument(args: { id: string; currentUserId: string; ipAddress: string }) {
  const doc = await prisma.document.findUnique({ where: { id: args.id } });
  if (!doc) return null;

  await prisma.document.delete({ where: { id: args.id } });

  return doc;
}
