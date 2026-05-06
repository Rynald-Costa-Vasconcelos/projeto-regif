import { prisma } from "../../lib/prismaClient";
import { clamp, parseDateRange, parseOrderBy } from "./documents.shared";

export async function listPublic(params: {
  page?: unknown;
  pageSize?: unknown;
  q?: unknown;
  categoryId?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
  date?: unknown;
  sort?: unknown;
  orderBy?: unknown;
}) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 1_000_000);
  const pageSize = clamp(Number(params.pageSize ?? 12) || 12, 6, 60);
  const skip = (page - 1) * pageSize;

  const q = String(params.q ?? "").trim();
  const categoryId = String(params.categoryId ?? "").trim();
  const dateFrom = String(params.dateFrom ?? "").trim();
  const dateTo = String(params.dateTo ?? "").trim();
  const date = String(params.date ?? "").trim();
  const sort = String(params.sort ?? "newest").trim();
  const orderByRaw = String(params.orderBy ?? "").trim();
  const orderBy = parseOrderBy(sort, orderByRaw);

  const where: any = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const createdAt = parseDateRange(dateFrom || undefined, dateTo || undefined, date || undefined);
  if (createdAt) where.createdAt = createdAt;

  const [total, docs] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items: docs, meta: { page, pageSize, total, totalPages } };
}

export async function listPublicCategories() {
  const categories = await prisma.documentCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, sortOrder: true },
  });
  return { items: categories };
}

export async function getBySlug(slug: string) {
  const found = await prisma.document.findUnique({
    where: { slug },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
  if (!found || found.status !== "PUBLISHED") return null;
  return found;
}

export async function downloadBySlug(slug: string) {
  const found = await prisma.document.findUnique({
    where: { slug },
    select: { id: true, status: true, fileUrl: true },
  });
  if (!found || found.status !== "PUBLISHED") return null;

  await prisma.document.update({
    where: { id: found.id },
    data: { downloads: { increment: 1 } },
  });

  return { redirectTo: found.fileUrl };
}

export async function listAdmin(params: {
  page?: unknown;
  pageSize?: unknown;
  q?: unknown;
  status?: unknown;
  categoryId?: unknown;
}) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 1_000_000);
  const pageSize = clamp(Number(params.pageSize ?? 20) || 20, 5, 100);
  const skip = (page - 1) * pageSize;

  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "").trim();
  const categoryId = String(params.categoryId ?? "").trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { uploadedBy: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const [total, items] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        uploadedBy: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items, meta: { page, pageSize, total, totalPages } };
}

export async function getById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}
