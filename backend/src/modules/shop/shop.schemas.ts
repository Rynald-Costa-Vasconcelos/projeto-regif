import { z } from "zod";

const cuid = z.string().min(20).max(32);

const moneyField = z.union([z.string().min(1).max(24), z.number()]);

const shopImageInput = z.object({
  url: z.string().min(1).max(2000),
  thumbUrl: z.string().max(2000).optional().nullable(),
  alt: z.string().max(300).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
});

const shopSpecInput = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(500),
  sortOrder: z.number().int().optional(),
});

/** Objeto cru (Zod 4: não usar .partial() em schema com superRefine — partial vem deste objeto). */
const shopProductBodySchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  description: z.string().max(500_000).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sortOrder: z.number().int().optional(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
  publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
  categoryId: cuid.optional().nullable(),
  price: moneyField,
  compareAtPrice: moneyField.optional().nullable(),
  stockQuantity: z.number().int().nonnegative().optional(),
  /** Upload temporário (obrigatório na criação) — ver POST /shop-media/tmp/cover */
  coverTmpId: cuid,
  galleryTmpIds: z.array(cuid).max(24).optional().default([]),
  images: z.array(shopImageInput).max(24).optional(),
  specifications: z.array(shopSpecInput).max(60).optional(),
});

export const createShopProductSchema = shopProductBodySchema.superRefine((data, ctx) => {
  if (data.images && data.images.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Na criação use coverTmpId e galleryTmpIds, não o campo images.",
      path: ["images"],
    });
  }
});

export const updateShopProductSchema = shopProductBodySchema
  .partial()
  .extend({
    coverTmpId: cuid.optional(),
    galleryTmpIds: z.array(cuid).max(24).optional(),
    /** Remove imagens já salvas (ids de `shop_product_images`). */
    deleteImageIds: z.array(cuid).max(24).optional(),
  })
  .superRefine((data, ctx) => {
    const hasLegacyImages = Boolean(data.images?.length);
    const hasTmp = Boolean(data.coverTmpId) || Boolean(data.galleryTmpIds?.length);
    if (hasLegacyImages && hasTmp) {
      ctx.addIssue({
        code: "custom",
        message: "Use apenas upload de imagens (capa/galeria) ou apenas URLs legadas, não os dois ao mesmo tempo.",
        path: ["images"],
      });
    }
    if (hasLegacyImages && Boolean(data.deleteImageIds?.length)) {
      ctx.addIssue({
        code: "custom",
        message: "Não combine exclusão por id (deleteImageIds) com o campo images.",
        path: ["deleteImageIds"],
      });
    }
  });

const addressBlock = z.object({
  recipientName: z.string().min(1).max(200).optional(),
  line1: z.string().min(1).max(240),
  line2: z.string().max(240).optional().nullable(),
  neighborhood: z.string().max(120).optional().nullable(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(1).max(32),
  country: z.string().length(2).optional(),
});

export const createPublicShopOrderSchema = z
  .object({
    customerEmail: z.string().email().max(320),
    customerName: z.string().min(1).max(200),
    customerPhone: z.string().max(40).optional().nullable(),
    customerDocument: z.string().max(32).optional().nullable(),
    items: z
      .array(
        z.object({
          productId: cuid,
          quantity: z.number().int().min(1).max(999),
        })
      )
      .min(1)
      .max(50),
    shippingTotal: moneyField.optional(),
    discountTotal: moneyField.optional(),
    taxTotal: moneyField.optional(),
    shipping: addressBlock,
    billingSameAsShipping: z.boolean().optional(),
    billing: addressBlock.optional(),
    customerNote: z.string().max(4000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.billingSameAsShipping === false && !val.billing) {
      ctx.addIssue({
        code: "custom",
        message: "Endereço de cobrança obrigatório quando for diferente da entrega.",
        path: ["billing"],
      });
    }
  });

export const guestOrderRequestCodeSchema = z.object({
  email: z.string().email().max(320),
});

export const guestOrderVerifyCodeSchema = z.object({
  email: z.string().email().max(320),
  code: z
    .string()
    .min(1)
    .max(16)
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length === 6, { message: "O código deve ter 6 dígitos." }),
});

export const updateShopOrderStatusSchema = z.object({
  status: z
    .enum([
      "AWAITING_PAYMENT",
      "PAYMENT_RECEIVED",
      "CONFIRMED",
      "PROCESSING",
      "READY_FOR_PICKUP",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "AUTHORIZED", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"])
    .optional(),
  paymentMethod: z
    .enum(["UNKNOWN", "PIX", "CREDIT_CARD", "DEBIT_CARD", "BOLETO", "CASH_ON_DELIVERY", "MANUAL", "OTHER"])
    .optional(),
  note: z.string().max(4000).optional().nullable(),
});
