import type { ShopOrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prismaClient";
import { AppError } from "../../core/http/errors";
import {
  appendGalleryFromTemps,
  commitCoverReplaceFromTmp,
  commitShopImagesFromTemps,
  rollbackShopMoves,
  unlinkShopImageUrls,
} from "./shop.imageCommit";
import { cleanupShopTempAssets } from "./shopMedia.service";
import { clamp, htmlToPlainDescription, moneyFromInput, moneyToString, slugify } from "./shop.shared";
import type {
  createPublicShopOrderSchema,
  createShopProductSchema,
  updateShopOrderStatusSchema,
  updateShopProductSchema,
} from "./shop.schemas";
import type { z } from "zod";

type CreateProductInput = z.infer<typeof createShopProductSchema>;
type UpdateProductInput = z.infer<typeof updateShopProductSchema>;
type CreateOrderInput = z.infer<typeof createPublicShopOrderSchema>;
type UpdateOrderStatusInput = z.infer<typeof updateShopOrderStatusSchema>;

function publicProductInclude() {
  return {
    category: { select: { id: true, name: true, slug: true, parentId: true } },
    images: { orderBy: { sortOrder: "asc" as const }, take: 8 },
    specifications: { orderBy: { sortOrder: "asc" as const } },
  } satisfies Prisma.ShopProductInclude;
}

type PublicProductRow = Prisma.ShopProductGetPayload<{ include: ReturnType<typeof publicProductInclude> }>;

function mapPublicProduct(row: PublicProductRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    status: row.status,
    sortOrder: row.sortOrder,
    publishedAt: row.publishedAt,
    category: row.category,
    images: row.images.map((i) => ({
      id: i.id,
      url: i.url,
      thumbUrl: i.thumbUrl,
      alt: i.alt,
      sortOrder: i.sortOrder,
      isPrimary: i.isPrimary,
    })),
    specifications: row.specifications.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
      sortOrder: s.sortOrder,
    })),
    price: moneyToString(row.price),
    compareAtPrice: row.compareAtPrice ? moneyToString(row.compareAtPrice) : null,
    stockQuantity: row.stockQuantity,
  };
}

async function uniqueProductSlug(base: string) {
  let candidate = base || "produto";
  for (let i = 0; i < 50; i++) {
    const exists = await prisma.shopProduct.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  throw new AppError({
    code: "slug_generation_failed",
    statusCode: 500,
    message: "Não foi possível gerar um slug único.",
  });
}

async function allocatePublicNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    const n = Math.floor(100_000 + Math.random() * 900_000);
    const candidate = `REGIF-${year}-${n}`;
    const clash = await tx.shopOrder.findUnique({ where: { publicNumber: candidate }, select: { id: true } });
    if (!clash) return candidate;
  }
  throw new AppError({
    code: "order_number_failed",
    statusCode: 503,
    message: "Serviço temporariamente indisponível ao gerar número do pedido.",
  });
}

export async function listPublicCategories() {
  const items = await prisma.shopCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
      parentId: true,
    },
  });
  return { items };
}

export async function listPublicProducts(params: {
  page?: unknown;
  pageSize?: unknown;
  q?: unknown;
  categorySlug?: unknown;
}) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 10_000);
  const pageSize = clamp(Number(params.pageSize ?? 12) || 12, 1, 48);
  const skip = (page - 1) * pageSize;
  const q = String(params.q ?? "").trim();
  const categorySlug = String(params.categorySlug ?? "").trim();

  let categoryIdIn: string[] | null = null;
  if (categorySlug) {
    const cat = await prisma.shopCategory.findFirst({
      where: { slug: categorySlug, isActive: true },
      select: { id: true },
    });
    if (!cat) {
      categoryIdIn = [];
    } else {
      const children = await prisma.shopCategory.findMany({
        where: { parentId: cat.id, isActive: true },
        select: { id: true },
      });
      categoryIdIn = children.length > 0 ? [cat.id, ...children.map((c) => c.id)] : [cat.id];
    }
  }

  const where: Prisma.ShopProductWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
  };
  if (categoryIdIn !== null) {
    if (categoryIdIn.length === 0) {
      where.id = { in: [] };
    } else {
      where.categoryId = { in: categoryIdIn };
    }
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.shopProduct.count({ where }),
    prisma.shopProduct.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
      include: publicProductInclude(),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items: rows.map(mapPublicProduct),
    meta: { page, pageSize, total, totalPages },
  };
}

/** Produtos publicados mais recentes (bloco “destaques” / vitrine na home). */
export async function listPublicFeatured(limit = 8) {
  const take = clamp(Number(limit) || 8, 1, 24);
  const rows = await prisma.shopProduct.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take,
    include: publicProductInclude(),
  });
  return { items: rows.map(mapPublicProduct) };
}

export async function getPublicProductBySlug(slug: string) {
  const row = await prisma.shopProduct.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    include: publicProductInclude(),
  });
  if (!row) return null;
  const base = mapPublicProduct(row);
  return {
    ...base,
    description: htmlToPlainDescription(row.description),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
  };
}

export async function createPublicOrder(input: CreateOrderInput, customerUserId: string | null) {
  let shippingTotal: Prisma.Decimal;
  let discountTotal: Prisma.Decimal;
  let taxTotal: Prisma.Decimal;
  try {
    shippingTotal = input.shippingTotal != null ? moneyFromInput(input.shippingTotal) : new Prisma.Decimal(0);
    discountTotal =
      input.discountTotal != null ? moneyFromInput(input.discountTotal) : new Prisma.Decimal(0);
    taxTotal = input.taxTotal != null ? moneyFromInput(input.taxTotal) : new Prisma.Decimal(0);
  } catch {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: "Valores de frete, desconto ou impostos inválidos.",
    });
  }

  if (shippingTotal.lessThan(0) || discountTotal.lessThan(0) || taxTotal.lessThan(0)) {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: "Valores monetários não podem ser negativos.",
    });
  }

  const billingSame = input.billingSameAsShipping !== false;

  return prisma.$transaction(async (tx) => {
    const lines: {
      productId: string;
      quantity: number;
      unit: Prisma.Decimal;
      compare: Prisma.Decimal | null;
      productTitle: string;
      sku: string | null;
      imageUrl: string | null;
    }[] = [];

    let subtotal = new Prisma.Decimal(0);

    for (const line of input.items) {
      const product = await tx.shopProduct.findUnique({
        where: { id: line.productId },
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
          price: true,
          compareAtPrice: true,
          stockQuantity: true,
        },
      });

      if (!product) {
        throw new AppError({
          code: "shop_product_not_found",
          statusCode: 400,
          message: "Produto não encontrado.",
          details: { productId: line.productId },
        });
      }

      if (product.status !== "PUBLISHED" || !product.publishedAt || product.publishedAt > new Date()) {
        throw new AppError({
          code: "shop_product_not_published",
          statusCode: 400,
          message: "Produto indisponível para compra.",
          details: { productId: line.productId },
        });
      }

      if (product.stockQuantity < line.quantity) {
        throw new AppError({
          code: "shop_insufficient_stock",
          statusCode: 400,
          message: `Estoque insuficiente para "${product.title}".`,
          details: { productId: product.id },
        });
      }

      const primary = await tx.shopProductImage.findFirst({
        where: { productId: product.id, isPrimary: true },
        select: { url: true },
      });
      const anyImg = primary
        ? primary.url
        : (
            await tx.shopProductImage.findFirst({
              where: { productId: product.id },
              orderBy: { sortOrder: "asc" },
              select: { url: true },
            })
          )?.url ?? null;

      const lineSub = product.price.mul(line.quantity);
      subtotal = subtotal.add(lineSub);

      lines.push({
        productId: product.id,
        quantity: line.quantity,
        unit: product.price,
        compare: product.compareAtPrice,
        productTitle: product.title,
        sku: null,
        imageUrl: anyImg,
      });
    }

    if (discountTotal.greaterThan(subtotal)) {
      throw new AppError({
        code: "validation_error",
        statusCode: 400,
        message: "Desconto não pode ser maior que o subtotal.",
      });
    }

    const grandTotal = subtotal.sub(discountTotal).add(shippingTotal).add(taxTotal);
    if (grandTotal.lessThan(0)) {
      throw new AppError({
        code: "validation_error",
        statusCode: 400,
        message: "Total do pedido inválido.",
      });
    }

    for (const line of lines) {
      if (line.quantity <= 0) continue;
      const updated = await tx.shopProduct.updateMany({
        where: { id: line.productId, stockQuantity: { gte: line.quantity } },
        data: { stockQuantity: { decrement: line.quantity } },
      });
      if (updated.count !== 1) {
        throw new AppError({
          code: "shop_insufficient_stock",
          statusCode: 400,
          message: "Estoque alterado durante o checkout. Tente novamente.",
        });
      }
    }

    const publicNumber = await allocatePublicNumber(tx);
    const ship = input.shipping;

    const order = await tx.shopOrder.create({
      data: {
        publicNumber,
        customerUserId,
        customerEmail: input.customerEmail.trim(),
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        customerDocument: input.customerDocument?.trim() || null,
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: "UNKNOWN",
        currency: "BRL",
        subtotal,
        discountTotal,
        shippingTotal,
        taxTotal,
        grandTotal,
        shippingRecipientName: ship.recipientName?.trim() || input.customerName.trim(),
        shippingLine1: ship.line1.trim(),
        shippingLine2: ship.line2?.trim() || null,
        shippingNeighborhood: ship.neighborhood?.trim() || null,
        shippingCity: ship.city.trim(),
        shippingState: ship.state.trim(),
        shippingPostalCode: ship.postalCode.trim(),
        shippingCountry: (ship.country ?? "BR").toUpperCase(),
        billingSameAsShipping: billingSame,
        billingRecipientName: billingSame
          ? null
          : input.billing?.recipientName?.trim() || input.customerName.trim(),
        billingLine1: billingSame ? null : input.billing?.line1.trim() ?? null,
        billingLine2: billingSame ? null : input.billing?.line2?.trim() || null,
        billingCity: billingSame ? null : input.billing?.city.trim() ?? null,
        billingState: billingSame ? null : input.billing?.state.trim() ?? null,
        billingPostalCode: billingSame ? null : input.billing?.postalCode.trim() ?? null,
        billingCountry: billingSame ? null : (input.billing?.country ?? "BR").toUpperCase(),
        customerNote: input.customerNote?.trim() || null,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPriceSnapshot: line.unit,
            compareAtSnapshot: line.compare,
            lineSubtotalSnapshot: line.unit.mul(line.quantity),
            productTitleSnapshot: line.productTitle,
            variantNameSnapshot: null,
            skuSnapshot: line.sku,
            imageUrlSnapshot: line.imageUrl,
          })),
        },
        statusLogs: {
          create: {
            toOrderStatus: "AWAITING_PAYMENT",
            toPaymentStatus: "PENDING",
            note: "Pedido criado (checkout público).",
          },
        },
      },
      select: {
        id: true,
        publicNumber: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        currency: true,
        createdAt: true,
      },
    });

    return {
      ...order,
      grandTotal: moneyToString(order.grandTotal),
    };
  });
}

// --- Admin: categorias (somente leitura — catálogo fixo via seed) ---

export async function listAdminCategories() {
  const items = await prisma.shopCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return { items };
}

// --- Admin: produtos ---

const adminProductInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ShopProductInclude;

function serializeAdminProduct(row: Prisma.ShopProductGetPayload<{ include: typeof adminProductInclude }>) {
  const { price, compareAtPrice, ...rest } = row;
  return {
    ...rest,
    price: moneyToString(price),
    compareAtPrice: compareAtPrice ? moneyToString(compareAtPrice) : null,
  };
}

export async function listAdminProducts(params: {
  page?: unknown;
  pageSize?: unknown;
  q?: unknown;
  status?: unknown;
  categoryId?: unknown;
}) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 10_000);
  const pageSize = clamp(Number(params.pageSize ?? 20) || 20, 1, 100);
  const skip = (page - 1) * pageSize;
  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "").trim();
  const categoryId = String(params.categoryId ?? "").trim();

  const where: Prisma.ShopProductWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [total, rows] = await Promise.all([
    prisma.shopProduct.count({ where }),
    prisma.shopProduct.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: pageSize,
      include: adminProductInclude,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items: rows.map(serializeAdminProduct),
    meta: { page, pageSize, total, totalPages },
  };
}

export async function createAdminProduct(ownerId: string, data: CreateProductInput) {
  const slug = await uniqueProductSlug(slugify(data.title));
  let price: Prisma.Decimal;
  let compareAt: Prisma.Decimal | null;
  try {
    price = moneyFromInput(data.price);
    compareAt = data.compareAtPrice != null ? moneyFromInput(data.compareAtPrice) : null;
  } catch {
    throw new AppError({
      code: "validation_error",
      statusCode: 400,
      message: "Preço inválido.",
    });
  }
  const stockQuantity = data.stockQuantity ?? 0;

  const { coverTmpId, galleryTmpIds = [], specifications } = data;

  const { rows, tmpIds, moved } = await commitShopImagesFromTemps({
    ownerId,
    coverTmpId,
    galleryTmpIds,
  });

  try {
    const out = await prisma.$transaction(async (tx) => {
      const product = await tx.shopProduct.create({
        data: {
          title: data.title.trim(),
          slug,
          excerpt: data.excerpt ?? null,
          description: data.description ?? null,
          status: data.status ?? "DRAFT",
          sortOrder: data.sortOrder ?? 0,
          price,
          compareAtPrice: compareAt,
          stockQuantity,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          publishedAt: data.publishedAt ?? null,
          categoryId: data.categoryId ?? null,
          images: {
            create: rows.map((img) => ({
              url: img.url,
              thumbUrl: img.thumbUrl,
              alt: img.alt,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            })),
          },
          specifications: {
            create: (specifications ?? []).map((s, idx) => ({
              label: s.label.trim(),
              value: s.value.trim(),
              sortOrder: s.sortOrder ?? idx,
            })),
          },
        },
        include: adminProductInclude,
      });

      const full = await tx.shopProduct.findUnique({
        where: { id: product.id },
        include: adminProductInclude,
      });
      return serializeAdminProduct(full!);
    });

    await cleanupShopTempAssets(tmpIds);
    return out;
  } catch (err) {
    await rollbackShopMoves(moved);
    throw err;
  }
}

export async function getAdminProduct(id: string) {
  const row = await prisma.shopProduct.findUnique({ where: { id }, include: adminProductInclude });
  if (!row) return null;
  return serializeAdminProduct(row);
}

export async function updateAdminProduct(ownerId: string, id: string, data: UpdateProductInput) {
  const existing = await prisma.shopProduct.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!existing) {
    throw new AppError({ code: "shop_product_not_found", statusCode: 404, message: "Produto não encontrado." });
  }

  type MovePair = { from: string; to: string };
  const allMoved: MovePair[] = [];
  let coverCommit: Awaited<ReturnType<typeof commitCoverReplaceFromTmp>> | null = null;
  let galleryCommit: Awaited<ReturnType<typeof appendGalleryFromTemps>> | null = null;

  try {
    if (data.coverTmpId) {
      coverCommit = await commitCoverReplaceFromTmp({ ownerId, coverTmpId: data.coverTmpId });
      allMoved.push(...coverCommit.moved);
    }
    if (data.galleryTmpIds && data.galleryTmpIds.length > 0) {
      const del = data.deleteImageIds?.filter(Boolean) ?? [];
      const maxAgg = await prisma.shopProductImage.aggregate({
        where:
          del.length > 0
            ? { productId: id, id: { notIn: [...new Set(del)] } }
            : { productId: id },
        _max: { sortOrder: true },
      });
      const startSort = (maxAgg._max.sortOrder ?? -1) + 1;
      galleryCommit = await appendGalleryFromTemps({
        ownerId,
        galleryTmpIds: data.galleryTmpIds,
        startSortOrder: startSort,
      });
      allMoved.push(...galleryCommit.moved);
    }

    const serialized = await prisma.$transaction(async (tx) => {
      const nextSlug =
        data.title !== undefined && data.title.trim() !== existing.title
          ? await uniqueProductSlug(slugify(data.title.trim()))
          : undefined;

      let nextPrice: Prisma.Decimal | undefined;
      let nextCompare: Prisma.Decimal | null | undefined;
      if (data.price !== undefined) {
        try {
          nextPrice = moneyFromInput(data.price);
        } catch {
          throw new AppError({ code: "validation_error", statusCode: 400, message: "Preço inválido." });
        }
      }
      if (data.compareAtPrice !== undefined) {
        try {
          nextCompare = data.compareAtPrice === null ? null : moneyFromInput(data.compareAtPrice);
        } catch {
          throw new AppError({
            code: "validation_error",
            statusCode: 400,
            message: "Preço promocional (compare-at) inválido.",
          });
        }
      }

      await tx.shopProduct.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title.trim() } : {}),
          ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
          ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
          ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
          ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(nextPrice !== undefined ? { price: nextPrice } : {}),
          ...(nextCompare !== undefined ? { compareAtPrice: nextCompare } : {}),
          ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
        },
      });

      if (data.deleteImageIds && data.deleteImageIds.length > 0) {
        const uniq = [...new Set(data.deleteImageIds)];
        const toDelete = await tx.shopProductImage.findMany({
          where: { productId: id, id: { in: uniq } },
        });
        if (toDelete.length !== uniq.length) {
          throw new AppError({
            code: "shop_image_not_found",
            statusCode: 400,
            message: "Uma ou mais imagens não pertencem a este produto.",
          });
        }
        const currentCount = await tx.shopProductImage.count({ where: { productId: id } });
        const afterCount = currentCount - toDelete.length;
        if (afterCount === 0 && !coverCommit) {
          throw new AppError({
            code: "validation_error",
            statusCode: 400,
            message: "Mantenha ao menos uma imagem publicada ou envie uma nova capa (upload).",
          });
        }
        const removedPrimary = toDelete.some((r) => r.isPrimary);
        for (const im of toDelete) {
          unlinkShopImageUrls(im.url, im.thumbUrl);
        }
        await tx.shopProductImage.deleteMany({ where: { productId: id, id: { in: uniq } } });
        if (removedPrimary && afterCount > 0) {
          const next = await tx.shopProductImage.findFirst({
            where: { productId: id },
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          });
          if (next) {
            await tx.shopProductImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
            await tx.shopProductImage.update({ where: { id: next.id }, data: { isPrimary: true } });
          }
        }
      }

      if (data.images !== undefined && data.images.length > 0) {
        const prev = await tx.shopProductImage.findMany({ where: { productId: id } });
        for (const im of prev) {
          unlinkShopImageUrls(im.url, im.thumbUrl);
        }
        await tx.shopProductImage.deleteMany({ where: { productId: id } });
        await tx.shopProductImage.createMany({
          data: data.images.map((img, idx) => ({
            productId: id,
            url: img.url.trim(),
            thumbUrl: img.thumbUrl?.trim() || null,
            alt: img.alt?.trim() || null,
            sortOrder: img.sortOrder ?? idx,
            isPrimary: img.isPrimary ?? idx === 0,
          })),
        });
      }

      if (coverCommit) {
        const primary = await tx.shopProductImage.findFirst({
          where: { productId: id, isPrimary: true },
        });
        if (primary) {
          unlinkShopImageUrls(primary.url, primary.thumbUrl);
          await tx.shopProductImage.update({
            where: { id: primary.id },
            data: { url: coverCommit.row.url, thumbUrl: coverCommit.row.thumbUrl },
          });
        } else {
          await tx.shopProductImage.create({
            data: {
              productId: id,
              url: coverCommit.row.url,
              thumbUrl: coverCommit.row.thumbUrl,
              alt: coverCommit.row.alt,
              sortOrder: 0,
              isPrimary: true,
            },
          });
        }
      }

      if (galleryCommit && galleryCommit.rows.length > 0) {
        await tx.shopProductImage.createMany({
          data: galleryCommit.rows.map((r) => ({
            productId: id,
            url: r.url,
            thumbUrl: r.thumbUrl,
            alt: r.alt,
            sortOrder: r.sortOrder,
            isPrimary: r.isPrimary,
          })),
        });
      }

      if (data.specifications) {
        await tx.shopProductSpecification.deleteMany({ where: { productId: id } });
        await tx.shopProductSpecification.createMany({
          data: data.specifications.map((s, idx) => ({
            productId: id,
            label: s.label.trim(),
            value: s.value.trim(),
            sortOrder: s.sortOrder ?? idx,
          })),
        });
      }

      const full = await tx.shopProduct.findUnique({ where: { id }, include: adminProductInclude });
      return serializeAdminProduct(full!);
    });

    const tmpCleanup: string[] = [];
    if (coverCommit) tmpCleanup.push(coverCommit.tmpId);
    if (galleryCommit) tmpCleanup.push(...galleryCommit.tmpIds);
    await cleanupShopTempAssets(tmpCleanup);

    return serialized;
  } catch (err) {
    if (allMoved.length) await rollbackShopMoves(allMoved);
    throw err;
  }
}

export async function deleteAdminProduct(id: string) {
  const used = await prisma.shopOrderItem.count({ where: { productId: id } });
  if (used > 0) {
    await prisma.shopProduct.update({ where: { id }, data: { status: "ARCHIVED" } });
    return { archived: true as const };
  }
  await prisma.shopProduct.delete({ where: { id } });
  return { archived: false as const };
}

// --- Admin: pedidos ---

export async function listAdminOrders(params: { page?: unknown; pageSize?: unknown; status?: unknown; q?: unknown }) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 10_000);
  const pageSize = clamp(Number(params.pageSize ?? 20) || 20, 1, 100);
  const skip = (page - 1) * pageSize;
  const status = String(params.status ?? "").trim();
  const q = String(params.q ?? "").trim();

  const where: Prisma.ShopOrderWhereInput = {};
  if (status && status !== "all") {
    where.status = status as ShopOrderStatus;
  }
  if (q) {
    where.OR = [
      { publicNumber: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.shopOrder.count({ where }),
    prisma.shopOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = rows.map((o) => ({
    ...o,
    subtotal: moneyToString(o.subtotal),
    discountTotal: moneyToString(o.discountTotal),
    shippingTotal: moneyToString(o.shippingTotal),
    taxTotal: moneyToString(o.taxTotal),
    grandTotal: moneyToString(o.grandTotal),
    items: o.items.map((it) => ({
      ...it,
      unitPriceSnapshot: moneyToString(it.unitPriceSnapshot),
      compareAtSnapshot: it.compareAtSnapshot ? moneyToString(it.compareAtSnapshot) : null,
      lineSubtotalSnapshot: moneyToString(it.lineSubtotalSnapshot),
    })),
  }));

  return { items, meta: { page, pageSize, total, totalPages } };
}

export async function getAdminOrder(id: string) {
  const o = await prisma.shopOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      statusLogs: { orderBy: { createdAt: "asc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
      customerUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!o) return null;
  return {
    ...o,
    subtotal: moneyToString(o.subtotal),
    discountTotal: moneyToString(o.discountTotal),
    shippingTotal: moneyToString(o.shippingTotal),
    taxTotal: moneyToString(o.taxTotal),
    grandTotal: moneyToString(o.grandTotal),
    items: o.items.map((it) => ({
      ...it,
      unitPriceSnapshot: moneyToString(it.unitPriceSnapshot),
      compareAtSnapshot: it.compareAtSnapshot ? moneyToString(it.compareAtSnapshot) : null,
      lineSubtotalSnapshot: moneyToString(it.lineSubtotalSnapshot),
    })),
  };
}

export async function updateAdminOrderStatus(id: string, data: UpdateOrderStatusInput, actorUserId: string) {
  const order = await prisma.shopOrder.findUnique({ where: { id } });
  if (!order) {
    throw new AppError({ code: "shop_order_not_found", statusCode: 404, message: "Pedido não encontrado." });
  }

  const nextStatus = data.status ?? order.status;
  const nextPayment = data.paymentStatus ?? order.paymentStatus;

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const patch: Prisma.ShopOrderUpdateInput = {};

    if (data.status !== undefined) patch.status = data.status;
    if (data.paymentStatus !== undefined) patch.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined) patch.paymentMethod = data.paymentMethod;

    if (data.paymentStatus === "PAID" || data.paymentStatus === "AUTHORIZED") {
      patch.paidAt = order.paidAt ?? now;
    }
    if (data.status === "SHIPPED") patch.shippedAt = order.shippedAt ?? now;
    if (data.status === "DELIVERED") patch.deliveredAt = order.deliveredAt ?? now;
    if (data.status === "CANCELLED") {
      patch.cancelledAt = now;
    }

    await tx.shopOrder.update({
      where: { id },
      data: patch,
    });

    await tx.shopOrderStatusLog.create({
      data: {
        orderId: id,
        fromOrderStatus: order.status,
        toOrderStatus: nextStatus,
        fromPaymentStatus: order.paymentStatus,
        toPaymentStatus: nextPayment,
        note: data.note ?? null,
        createdByUserId: actorUserId,
      },
    });

    return getAdminOrder(id);
  });
}

// --- Público: acesso a pedidos por e-mail + OTP (uso único) ---

const GUEST_OTP_TTL_MS = 15 * 60 * 1000;
const GUEST_JWT_EXPIRES_IN = "7d" as const;
const MAX_OTP_REQUESTS_PER_EMAIL_PER_HOUR = 5;

function normalizeGuestOrderEmail(email: string) {
  return email.trim().toLowerCase();
}

function guestOtpPepper() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new AppError({
      code: "server_misconfigured",
      statusCode: 500,
      message: "Servidor sem JWT_SECRET configurado.",
    });
  }
  return `${s}::shop_guest_order_otp_v1`;
}

function hashGuestOrderOtp(emailNorm: string, code: string) {
  return createHash("sha256").update(`${guestOtpPepper()}|${emailNorm}|${code}`).digest("hex");
}

const guestOrderInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  statusLogs: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      fromOrderStatus: true,
      toOrderStatus: true,
      fromPaymentStatus: true,
      toPaymentStatus: true,
      note: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ShopOrderInclude;

type GuestOrderRow = Prisma.ShopOrderGetPayload<{ include: typeof guestOrderInclude }>;

function serializeGuestShopOrder(o: GuestOrderRow) {
  return {
    id: o.id,
    publicNumber: o.publicNumber,
    customerEmail: o.customerEmail,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerDocument: o.customerDocument,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    currency: o.currency,
    subtotal: moneyToString(o.subtotal),
    discountTotal: moneyToString(o.discountTotal),
    shippingTotal: moneyToString(o.shippingTotal),
    taxTotal: moneyToString(o.taxTotal),
    grandTotal: moneyToString(o.grandTotal),
    shippingRecipientName: o.shippingRecipientName,
    shippingLine1: o.shippingLine1,
    shippingLine2: o.shippingLine2,
    shippingNeighborhood: o.shippingNeighborhood,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    shippingPostalCode: o.shippingPostalCode,
    shippingCountry: o.shippingCountry,
    billingSameAsShipping: o.billingSameAsShipping,
    billingRecipientName: o.billingRecipientName,
    billingLine1: o.billingLine1,
    billingLine2: o.billingLine2,
    billingCity: o.billingCity,
    billingState: o.billingState,
    billingPostalCode: o.billingPostalCode,
    billingCountry: o.billingCountry,
    customerNote: o.customerNote,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    cancelReason: o.cancelReason,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      unitPriceSnapshot: moneyToString(it.unitPriceSnapshot),
      compareAtSnapshot: it.compareAtSnapshot ? moneyToString(it.compareAtSnapshot) : null,
      lineSubtotalSnapshot: moneyToString(it.lineSubtotalSnapshot),
      productTitleSnapshot: it.productTitleSnapshot,
      variantNameSnapshot: it.variantNameSnapshot,
      skuSnapshot: it.skuSnapshot,
      imageUrlSnapshot: it.imageUrlSnapshot,
    })),
    statusLogs: o.statusLogs.map((log) => ({
      id: log.id,
      fromOrderStatus: log.fromOrderStatus,
      toOrderStatus: log.toOrderStatus,
      fromPaymentStatus: log.fromPaymentStatus,
      toPaymentStatus: log.toPaymentStatus,
      note: log.note,
      createdAt: log.createdAt,
    })),
  };
}

export async function requestGuestShopOrderAccessCode(emailRaw: string) {
  const emailNorm = normalizeGuestOrderEmail(emailRaw);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.shopGuestOrderOtp.count({
    where: { emailNorm, createdAt: { gte: hourAgo } },
  });
  if (recentCount >= MAX_OTP_REQUESTS_PER_EMAIL_PER_HOUR) {
    throw new AppError({
      code: "rate_limited",
      statusCode: 429,
      message: "Muitas solicitações para este e-mail. Aguarde cerca de uma hora ou tente outro contato.",
    });
  }

  const hasOrders = await prisma.shopOrder.findFirst({
    where: { customerEmail: { equals: emailNorm, mode: "insensitive" } },
    select: { id: true },
  });

  if (!hasOrders) {
    return {
      ok: true as const,
      codeSent: false as const,
      message: "Não encontramos pedidos com este e-mail. Confira o endereço ou use o mesmo e-mail da compra.",
    };
  }

  await prisma.shopGuestOrderOtp.updateMany({
    where: {
      emailNorm,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  const code = String(randomInt(100_000, 1_000_000));
  const codeHash = hashGuestOrderOtp(emailNorm, code);
  const expiresAt = new Date(Date.now() + GUEST_OTP_TTL_MS);

  const row = await prisma.shopGuestOrderOtp.create({
    data: { emailNorm, codeHash, expiresAt },
  });

  try {
    const { emailService } = await import("../../infra/email/email.service");
    await emailService.sendShopGuestOrderOtp({
      toEmail: emailRaw.trim(),
      code,
      expiresAt,
    });
  } catch (err) {
    console.error("[shop] guest OTP email failed", err);
    await prisma.shopGuestOrderOtp.delete({ where: { id: row.id } }).catch(() => {});
    throw new AppError({
      code: "email_send_failed",
      statusCode: 503,
      message: "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.",
    });
  }

  return {
    ok: true as const,
    codeSent: true as const,
    message: "Enviamos um código de 6 dígitos para o seu e-mail. Verifique também a caixa de spam.",
  };
}

export async function verifyGuestShopOrderAccessCode(emailRaw: string, code: string) {
  const emailNorm = normalizeGuestOrderEmail(emailRaw);
  const now = new Date();

  const row = await prisma.shopGuestOrderOtp.findFirst({
    where: {
      emailNorm,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new AppError({
      code: "shop_guest_otp_invalid",
      statusCode: 400,
      message: "Código inválido ou expirado. Solicite um novo código.",
    });
  }

  const expected = Buffer.from(row.codeHash, "hex");
  const got = Buffer.from(hashGuestOrderOtp(emailNorm, code), "hex");
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
    throw new AppError({
      code: "shop_guest_otp_invalid",
      statusCode: 400,
      message: "Código incorreto.",
    });
  }

  await prisma.shopGuestOrderOtp.update({
    where: { id: row.id },
    data: { usedAt: now },
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError({
      code: "server_misconfigured",
      statusCode: 500,
      message: "Servidor sem JWT_SECRET configurado.",
    });
  }

  const token = jwt.sign({ typ: "SHOP_GUEST_ORDERS", v: 1, email: emailNorm }, secret, {
    expiresIn: GUEST_JWT_EXPIRES_IN,
  });

  return { token, tokenType: "Bearer" as const };
}

export async function listGuestShopOrdersForEmail(emailNorm: string) {
  const rows = await prisma.shopOrder.findMany({
    where: { customerEmail: { equals: emailNorm, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    include: guestOrderInclude,
  });
  return rows.map(serializeGuestShopOrder);
}

export async function getGuestShopOrderForEmail(orderId: string, emailNorm: string) {
  const o = await prisma.shopOrder.findFirst({
    where: {
      id: orderId,
      customerEmail: { equals: emailNorm, mode: "insensitive" },
    },
    include: guestOrderInclude,
  });
  if (!o) return null;
  return serializeGuestShopOrder(o);
}
