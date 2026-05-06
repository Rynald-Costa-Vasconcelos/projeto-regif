import { prisma } from "../../../lib/prismaClient";

// ======================================================
// Helpers internos (somente para queries)
// ======================================================

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function dayBoundsBR(date: string) {
  const start = new Date(`${date}T00:00:00.000-03:00`);
  const end = new Date(`${date}T23:59:59.999-03:00`);
  return { start, end };
}

function parseDateRange(
  dateFrom?: string,
  dateTo?: string,
  exactDate?: string
) {
  if (exactDate) {
    const { start, end } = dayBoundsBR(exactDate);
    return { gte: start, lte: end };
  }

  const createdAt: any = {};
  if (dateFrom) {
    const { start } = dayBoundsBR(dateFrom);
    createdAt.gte = start;
  }
  if (dateTo) {
    const { end } = dayBoundsBR(dateTo);
    createdAt.lte = end;
  }

  return Object.keys(createdAt).length ? createdAt : undefined;
}

function parseOrderBy(sort?: string, orderBy?: string) {
  if (orderBy === "createdAt:asc") return { createdAt: "asc" as const };
  if (orderBy === "createdAt:desc") return { createdAt: "desc" as const };

  if (sort === "createdAt:asc") return { createdAt: "asc" as const };
  if (sort === "createdAt:desc") return { createdAt: "desc" as const };

  if (sort === "oldest") return { createdAt: "asc" as const };
  return { createdAt: "desc" as const };
}

// ======================================================
// ADMIN
// ======================================================

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
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const [total, items] = await Promise.all([
    prisma.newsPost.count({ where }),
    prisma.newsPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
        coverAsset: { select: { id: true, url: true, thumbUrl: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { page, pageSize, total, totalPages } };
}

// ======================================================
// PÚBLICO
// ======================================================

export async function listPublicCategories() {
  const categories = await prisma.newsCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, color: true },
  });

  return { items: categories };
}

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
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;

  const createdAt = parseDateRange(
    dateFrom || undefined,
    dateTo || undefined,
    date || undefined
  );
  if (createdAt) where.createdAt = createdAt;

  const [total, posts] = await Promise.all([
    prisma.newsPost.count({ where }),
    prisma.newsPost.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        author: { select: { name: true, avatarUrl: true } },
        category: true,
        coverAsset: { select: { id: true, url: true, thumbUrl: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items: posts, meta: { page, pageSize, total, totalPages } };
}

// ======================================================
// GETTERS
// ======================================================

export async function getBySlug(slug: string, ipAddress: string) {
  const found = await prisma.newsPost.findUnique({ where: { slug } });
  if (!found || found.status !== "PUBLISHED") return null;

  const post = await prisma.newsPost.update({
    where: { id: found.id },
    data: { views: { increment: 1 } },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      category: true,
      coverAsset: true,
      assets: { orderBy: { order: "asc" } },
      links: { orderBy: { order: "asc" } },
    },
  });

  void ipAddress;
  return post;
}

export async function getById(id: string) {
  return prisma.newsPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      category: true,
      coverAsset: true,
      assets: { orderBy: { order: "asc" } },
      links: { orderBy: { order: "asc" } },
    },
  });
}

export async function listCategoriesAdmin() {
  const categories = await prisma.newsCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, color: true, createdAt: true },
  });

  return { data: categories };
}
