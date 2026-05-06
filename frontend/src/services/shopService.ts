import type { AxiosRequestConfig } from "axios";

import { api } from "../lib/api";
import { shopGuestApi } from "../lib/shopGuestApi";
import { normalizeList, type PaginationMeta } from "../shared/api/contracts";

type GetConfig = Pick<AxiosRequestConfig, "signal" | "headers" | "timeout">;

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

// --- Tipos (alinhados ao backend) ---

export type ShopProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ShopPublicCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  parentId?: string | null;
};

export type ShopPublicProduct = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  status: ShopProductStatus;
  sortOrder: number;
  publishedAt?: string | null;
  category?: { id: string; name: string; slug: string; parentId?: string | null } | null;
  images: Array<{
    id: string;
    url: string;
    thumbUrl?: string | null;
    alt?: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  specifications: Array<{ id: string; label: string; value: string; sortOrder: number }>;
  price: string;
  compareAtPrice?: string | null;
  stockQuantity: number;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type ShopAdminProduct = ShopPublicProduct & {
  createdAt: string;
  updatedAt: string;
  category?: ShopPublicCategory | null;
};

export type ShopOrderStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_RECEIVED"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type ShopPaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED";

export type CreatePublicOrderPayload = {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  customerDocument?: string | null;
  items: Array<{ productId: string; quantity: number }>;
  shippingTotal?: string | number;
  discountTotal?: string | number;
  taxTotal?: string | number;
  shipping: {
    recipientName?: string;
    line1: string;
    line2?: string | null;
    neighborhood?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  billingSameAsShipping?: boolean;
  billing?: {
    recipientName?: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  customerNote?: string | null;
};

// --- Público ---

export async function listPublicShopCategories(config?: GetConfig) {
  const { data } = await api.get("/shop/public/categories", { ...config });
  return (data?.items ?? []) as ShopPublicCategory[];
}

export async function listPublicShopProducts(
  params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    categorySlug?: string;
  },
  config?: GetConfig
) {
  const { data } = await api.get("/shop/public/products", {
    params: {
      page: params?.page,
      pageSize: params?.pageSize,
      q: params?.q,
      categorySlug: params?.categorySlug,
    },
    ...config,
  });
  return normalizeList<ShopPublicProduct>(data);
}

export async function listPublicShopFeatured(limit?: number, config?: GetConfig) {
  const { data } = await api.get("/shop/public/products/featured", {
    params: { limit },
    ...config,
  });
  return (data?.items ?? []) as ShopPublicProduct[];
}

export async function getPublicShopProductBySlug(slug: string, config?: GetConfig) {
  const { data } = await api.get(`/shop/public/products/slug/${encodeURIComponent(slug)}`, {
    ...config,
  });
  const body = data as { data?: ShopPublicProduct };
  return (body?.data ?? unwrapData<ShopPublicProduct>(data)) as ShopPublicProduct;
}

export type ShopGuestOrderItem = {
  id: string;
  quantity: number;
  unitPriceSnapshot: string;
  lineSubtotalSnapshot: string;
  productTitleSnapshot: string;
  imageUrlSnapshot?: string | null;
};

export type ShopGuestOrderStatusLog = {
  id: string;
  fromOrderStatus?: string | null;
  toOrderStatus: string;
  fromPaymentStatus?: string | null;
  toPaymentStatus?: string | null;
  note?: string | null;
  createdAt: string;
};

export type ShopGuestOrder = {
  id: string;
  publicNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  status: ShopOrderStatus;
  paymentStatus: ShopPaymentStatus;
  paymentMethod: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  shippingRecipientName?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingNeighborhood?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  billingSameAsShipping?: boolean;
  customerNote?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShopGuestOrderItem[];
  statusLogs: ShopGuestOrderStatusLog[];
};

export async function requestShopGuestOrderCode(email: string, config?: GetConfig) {
  const { data } = await api.post("/shop/public/guest-orders/request-code", { email }, { ...config });
  return unwrapData<{ ok: boolean; codeSent: boolean; message: string }>(data);
}

export async function verifyShopGuestOrderCode(
  body: { email: string; code: string },
  config?: GetConfig
) {
  const { data } = await api.post("/shop/public/guest-orders/verify-code", body, { ...config });
  return unwrapData<{ token: string; tokenType: string }>(data);
}

export async function listShopGuestOrders(config?: GetConfig) {
  const { data } = await shopGuestApi.get("/shop/public/guest-orders", { ...config });
  return (data?.items ?? []) as ShopGuestOrder[];
}

export async function getShopGuestOrder(id: string, config?: GetConfig) {
  const { data } = await shopGuestApi.get(`/shop/public/guest-orders/${encodeURIComponent(id)}`, {
    ...config,
  });
  const body = data as { data?: ShopGuestOrder };
  return (body?.data ?? unwrapData<ShopGuestOrder>(data)) as ShopGuestOrder;
}

export async function createPublicShopOrder(payload: CreatePublicOrderPayload, config?: GetConfig) {
  const { data } = await api.post("/shop/public/orders", payload, { ...config });
  const body = data as {
    data?: {
      id: string;
      publicNumber: string;
      status: ShopOrderStatus;
      paymentStatus: ShopPaymentStatus;
      grandTotal: string;
      currency: string;
      createdAt: string;
    };
  };
  if (body?.data) return body.data;
  return unwrapData<{
    id: string;
    publicNumber: string;
    status: ShopOrderStatus;
    paymentStatus: ShopPaymentStatus;
    grandTotal: string;
    currency: string;
    createdAt: string;
  }>(data);
}

// --- Admin ---

export async function listAdminShopCategories(config?: GetConfig) {
  const { data } = await api.get("/shop/admin/categories", { ...config });
  return (data?.items ?? []) as ShopPublicCategory[];
}

export async function listAdminShopProducts(
  params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: ShopProductStatus;
    categoryId?: string;
  },
  config?: GetConfig
) {
  const { data } = await api.get("/shop/admin/products", { params, ...config });
  return normalizeList<ShopAdminProduct>(data) as {
    items: ShopAdminProduct[];
    meta?: PaginationMeta;
  };
}

export type ShopAdminProductPayload = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  status?: ShopProductStatus;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | string | null;
  categoryId?: string | null;
  price: string | number;
  compareAtPrice?: string | number | null;
  stockQuantity?: number;
  images?: Array<{
    url: string;
    thumbUrl?: string | null;
    alt?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
  }>;
  specifications?: Array<{ label: string; value: string; sortOrder?: number }>;
  /** Upload temporário da capa (POST /shop-media/tmp/cover) — obrigatório na criação */
  coverTmpId?: string;
  /** Novas imagens de galeria (POST /shop-media/tmp/gallery) */
  galleryTmpIds?: string[];
  /** Remover imagens já salvas (apenas edição) */
  deleteImageIds?: string[];
};

export async function createAdminShopProduct(body: ShopAdminProductPayload, config?: GetConfig) {
  const { data } = await api.post("/shop/admin/products", body, { ...config });
  const bodyRes = data as { data?: ShopAdminProduct };
  return (bodyRes?.data ?? unwrapData<ShopAdminProduct>(data)) as ShopAdminProduct;
}

export async function getAdminShopProduct(id: string, config?: GetConfig) {
  const { data } = await api.get(`/shop/admin/products/${encodeURIComponent(id)}`, { ...config });
  const body = data as { data?: ShopAdminProduct };
  return (body?.data ?? unwrapData<ShopAdminProduct>(data)) as ShopAdminProduct;
}

export async function updateAdminShopProduct(
  id: string,
  body: Partial<ShopAdminProductPayload>,
  config?: GetConfig
) {
  const { data } = await api.patch(`/shop/admin/products/${encodeURIComponent(id)}`, body, {
    ...config,
  });
  const bodyRes = data as { data?: ShopAdminProduct };
  return (bodyRes?.data ?? unwrapData<ShopAdminProduct>(data)) as ShopAdminProduct;
}

export async function deleteAdminShopProduct(id: string, config?: GetConfig) {
  const { data } = await api.delete(`/shop/admin/products/${encodeURIComponent(id)}`, {
    ...config,
  });
  return unwrapData<{ archived: boolean }>(data);
}

/** Tamanho do recorte enviado ao servidor (WebP 1024×1024 no backend). */
export const SHOP_PRODUCT_IMAGE_CROP_PX = 1024;

export async function uploadAdminShopCoverTmp(file: File | Blob, config?: GetConfig) {
  const fd = new FormData();
  fd.append("cover", file, `cover_${Date.now()}.jpg`);
  const { data } = await api.post("/shop-media/tmp/cover", fd, {
    ...config,
    headers: { "Content-Type": "multipart/form-data", ...config?.headers },
    timeout: 120_000,
  });
  return data as {
    tmpId: string;
    kind: "SHOP_COVER";
    url: string;
    thumbUrl: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    expiresAt: string;
  };
}

export async function uploadAdminShopGalleryTmp(files: File[], config?: GetConfig) {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);
  const { data } = await api.post("/shop-media/tmp/gallery", fd, {
    ...config,
    headers: { "Content-Type": "multipart/form-data", ...config?.headers },
    timeout: 120_000,
  });
  return data as {
    kind: "SHOP_GALLERY";
    items: Array<{
      tmpId: string;
      url: string;
      thumbUrl: string;
      width: number | null;
      height: number | null;
      sizeBytes: number;
      expiresAt: string;
    }>;
  };
}

export async function deleteAdminShopMediaTmp(tmpId: string, config?: GetConfig) {
  await api.delete(`/shop-media/tmp/${encodeURIComponent(tmpId)}`, { ...config });
}

export async function listAdminShopOrders(
  params?: { page?: number; pageSize?: number; status?: ShopOrderStatus | "all"; q?: string },
  config?: GetConfig
) {
  const { data } = await api.get("/shop/admin/orders", { params, ...config });
  return normalizeList<Record<string, unknown>>(data) as {
    items: Record<string, unknown>[];
    meta?: PaginationMeta;
  };
}

export async function getAdminShopOrder(id: string, config?: GetConfig) {
  const { data } = await api.get(`/shop/admin/orders/${encodeURIComponent(id)}`, { ...config });
  const body = data as { data?: Record<string, unknown> };
  return (body?.data ?? unwrapData<Record<string, unknown>>(data)) as Record<string, unknown>;
}

export async function updateAdminShopOrderStatus(
  id: string,
  body: {
    status?: ShopOrderStatus;
    paymentStatus?: ShopPaymentStatus;
    paymentMethod?: string;
    note?: string | null;
  },
  config?: GetConfig
) {
  const { data } = await api.patch(`/shop/admin/orders/${encodeURIComponent(id)}/status`, body, {
    ...config,
  });
  return unwrapData<Record<string, unknown>>(data);
}
