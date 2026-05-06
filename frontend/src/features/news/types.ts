// src/features/news/types.ts

// ==========================================
// UTILS & COMMON
// ==========================================

export type ApiError = {
  message: string;
  status?: number;
  url?: string;
  details?: unknown;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// ==========================================
// ENUMS & STATUS
// ==========================================

export type NewsStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
// Alias para manter compatibilidade com o Editor
export type PostStatus = NewsStatus;
export type AdminNewsStatus = NewsStatus;

export type AssetRole = "COVER" | "GALLERY" | "ATTACHMENT";

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

export interface NewsCategoryDTO {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export interface NewsAuthorDTO {
  id?: string;
  name: string;
  avatarUrl?: string | null;
}

export interface NewsCoverAssetDTO {
  id?: string;
  url?: string | null;
  thumbUrl?: string | null;
}

// Usado no formulário (ID é opcional pois pode ser novo)
export interface NewsLinkDTO {
  id?: string;
  url: string;
  title?: string | null;
  description?: string | null;
  order: number;
}

// ==========================================
// ENTITIES (API RESPONSES)
// ==========================================

export interface NewsAsset {
  id: string;
  url: string;
  thumbUrl?: string | null;
  caption?: string | null;
  role: AssetRole;
  order: number;
}

// Usado na exibição (ID vem do banco)
export interface NewsLink {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  order: number;
}

export interface PublicNewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentHtml?: string;
  
  // Campo padronizado pro frontend
  coverImageUrl?: string | null;

  createdAt: string;
  updatedAt?: string;
  isFeatured?: boolean;
  showFeaturedImage?: boolean;

  category?: NewsCategoryDTO | null;
  author?: NewsAuthorDTO | null;
  coverAsset?: NewsCoverAssetDTO | null;
}

export interface AdminNewsItem {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string | null;

  status: NewsStatus;
  views: number;

  createdAt: string;
  updatedAt?: string;

  author: { name: string };
  category?: { name: string } | null;

  coverAsset?: NewsCoverAssetDTO | null;
  coverImageUrl?: string | null;
}

export interface PublicNewsDetail {
  id: string;
  title: string;
  excerpt?: string | null;
  contentHtml?: string | null;

  status: NewsStatus;
  views?: number;
  createdAt: string;

  showFeaturedImage?: boolean;
  enableGallery?: boolean;
  enableLinks?: boolean;

  author?: { name: string; avatarUrl?: string | null } | null;
  category?: { name: string } | null;

  coverAsset?: NewsAsset | null;
  assets?: NewsAsset[];
  links?: NewsLink[];
}

// ==========================================
// LISTS & PARAMS
// ==========================================

export type PublicListResult = { items: PublicNewsItem[]; meta?: PaginationMeta };
export type AdminListResult = { items: AdminNewsItem[]; meta?: PaginationMeta };

export const ADMIN_NEWS_PAGE_SIZE = 20;

export type PublicNewsArchiveParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  date?: string;
  sort?: "newest" | "oldest";
};

export type AdminNewsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: NewsStatus;
  categoryId?: string;
};

// ==========================================
// EDITOR HELPERS (UI ONLY)
// ==========================================

export interface CropArea {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface NewsEditorSectionProps {
  disabled?: boolean;
}