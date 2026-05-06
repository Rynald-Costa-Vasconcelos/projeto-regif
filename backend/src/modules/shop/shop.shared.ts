import { Prisma } from "@prisma/client";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function moneyFromInput(v: string | number): Prisma.Decimal {
  const s = typeof v === "number" ? String(v) : String(v).trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) {
    throw new Error("invalid_money");
  }
  return new Prisma.Decimal(s);
}

export function moneyToString(d: Prisma.Decimal): string {
  return d.toFixed(2);
}

/** Converte HTML legado em texto simples para exibição na vitrine. Texto sem tags permanece igual. */
export function htmlToPlainDescription(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  const withBreaks = s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\/\s*div\s*>/gi, "\n")
    .replace(/<\/\s*h[1-6]\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const normalized = withBreaks
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized || null;
}
