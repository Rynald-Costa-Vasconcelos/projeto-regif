import { prisma } from "../../lib/prismaClient";
import { generateSlug } from "../../utils/slugify";
import type { CreateCategoryInput, UpdateCategoryInput } from "./documents.schemas";

export async function listCategoriesAdmin() {
  const categories = await prisma.documentCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { data: categories };
}

export async function createCategory(args: {
  data: CreateCategoryInput;
  currentUserId: string;
  ipAddress: string;
}) {
  let slug = args.data.slug?.trim() ? args.data.slug.trim() : generateSlug(args.data.name);
  const existing = await prisma.documentCategory.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  return prisma.documentCategory.create({
    data: { name: args.data.name, slug, sortOrder: args.data.sortOrder },
  });
}

export async function updateCategory(args: {
  id: string;
  data: UpdateCategoryInput;
  currentUserId: string;
  ipAddress: string;
}) {
  let nextSlug: string | undefined;
  if (typeof args.data.slug === "string" && args.data.slug.trim()) {
    nextSlug = args.data.slug.trim();
  } else if (typeof args.data.name === "string") {
    nextSlug = generateSlug(args.data.name);
  }

  if (nextSlug) {
    const existing = await prisma.documentCategory.findUnique({ where: { slug: nextSlug } });
    if (existing && existing.id !== args.id) nextSlug = `${nextSlug}-${Date.now()}`;
  }

  const before = await prisma.documentCategory.findUnique({ where: { id: args.id } });
  if (!before) return null;

  return prisma.documentCategory.update({
    where: { id: args.id },
    data: {
      ...(typeof args.data.name === "string" ? { name: args.data.name } : {}),
      ...(args.data.sortOrder !== undefined ? { sortOrder: args.data.sortOrder } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
    },
  });
}

export async function deleteCategory(args: { id: string; currentUserId: string; ipAddress: string }) {
  const count = await prisma.document.count({ where: { categoryId: args.id } });
  if (count > 0) {
    const e: any = new Error("Não é possível excluir: existem documentos vinculados a essa categoria.");
    e.statusCode = 409;
    throw e;
  }

  await prisma.documentCategory.delete({ where: { id: args.id } });
}
