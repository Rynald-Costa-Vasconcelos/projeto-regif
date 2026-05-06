import { api } from "../../../lib/api";
import type { AxiosError, AxiosRequestConfig } from "axios";

export type PostStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
export type AssetRole = "COVER" | "GALLERY";

export interface NewsAssetDTO {
  id: string;
  url: string;
  thumbUrl?: string | null;
  caption?: string | null;
  role: AssetRole;
  order: number;
}

export interface NewsLinkDTO {
  id?: string;
  url: string;
  title?: string | null;
  description?: string | null;
  order: number;
}

export interface NewsPostDTO {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  contentHtml: string;
  status: PostStatus;
  isFeatured: boolean;
  showFeaturedImage?: boolean;
  enableGallery?: boolean;
  enableLinks?: boolean;
  createdAt?: string;
  updatedAt?: string;
  author?: { name: string };
  category?: { id: string; name: string } | null;
  categoryId?: string | null;
  coverAsset?: NewsAssetDTO | null;
  assets?: NewsAssetDTO[];
  links?: NewsLinkDTO[];
}

export interface NewsCategoryDTO {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  url?: string;
}

export type ErrorPayload = { erro?: string; message?: string };
export type Area = { width: number; height: number; x: number; y: number };

export const REQUEST_TIMEOUT_MS = 10000;
export const API_ORIGIN = String(api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function apiGet<T = unknown>(path: string, config?: AxiosRequestConfig) {
  return api.get<T>(normalizePath(path), { timeout: REQUEST_TIMEOUT_MS, ...config });
}

export async function apiPatch<T = unknown>(path: string, data?: unknown, config?: AxiosRequestConfig) {
  return api.patch<T>(normalizePath(path), data, { timeout: REQUEST_TIMEOUT_MS, ...config });
}

export function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<ErrorPayload>;
  const status = e.response?.status;
  const baseURL = (e.config?.baseURL ?? api.defaults.baseURL ?? "").toString();
  const url = e.config?.url ? `${baseURL}${e.config.url}` : baseURL || undefined;

  let message = e.message || "Erro inesperado";
  const code = e.code;

  if (code === "ECONNABORTED") message = "Tempo limite excedido ao consultar a API.";
  if (status === 401) message = "Sessão expirada ou token ausente. Faça login novamente.";
  if (status === 403) message = "Você não tem permissão (precisa ser ADMIN/EDITOR).";
  if (status === 404) message = "Notícia não encontrada (ou endpoint incorreto).";

  return { message, code, status, url };
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function humanizeAxiosError(err: AxiosError<ErrorPayload>) {
  const status = err.response?.status;
  if (err.code === "ECONNABORTED") return "Tempo limite excedido ao salvar. Tente novamente.";
  if (status === 400) {
    const data = err.response?.data;
    const msg = data?.erro ? String(data.erro) : "Dados inválidos.";
    return `${msg} (Confira título e conteúdo)`;
  }
  if (status === 401) return "Você não está autenticado. Faça login novamente.";
  if (status === 403) return "Você não tem permissão (precisa ser ADMIN/EDITOR).";
  return "Erro inesperado ao salvar a notícia.";
}

export function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function mediaUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return u;
}

export async function getImageSize(file: File): Promise<{ w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao ler imagem"));
      img.src = url;
    });
    return { w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    if (url.startsWith("http://") || url.startsWith("https://")) {
      image.crossOrigin = "anonymous";
    }
    image.src = url;
  });
}

export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  output: { width: number; height: number } = { width: 1280, height: 720 }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context não disponível");
  canvas.width = output.width;
  canvas.height = output.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    output.width,
    output.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Falha ao gerar Blob"));
      else resolve(blob);
    }, "image/jpeg", 0.92);
  });
}
