// ======================================================
// NEWS HELPERS
// ======================================================
// Helpers puros e reutilizáveis do módulo News
// (datas, paginação, ordenação)
// ======================================================

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function dayBoundsBR(date: string) {
  const start = new Date(`${date}T00:00:00.000-03:00`);
  const end = new Date(`${date}T23:59:59.999-03:00`);
  return { start, end };
}

export function parseDateRange(
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

export function parseOrderBy(sort?: string, orderBy?: string) {
  if (orderBy === "createdAt:asc") return { createdAt: "asc" as const };
  if (orderBy === "createdAt:desc") return { createdAt: "desc" as const };

  if (sort === "createdAt:asc") return { createdAt: "asc" as const };
  if (sort === "createdAt:desc") return { createdAt: "desc" as const };

  if (sort === "oldest") return { createdAt: "asc" as const };

  return { createdAt: "desc" as const };
}
