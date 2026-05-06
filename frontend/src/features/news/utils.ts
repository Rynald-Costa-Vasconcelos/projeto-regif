// src/features/news/utils.ts
import { AxiosError } from "axios";
import type { CropArea } from "./types"; // <--- Correção aqui (import type)
type ErrorPayload = { erro?: string; message?: string };

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeNewsContentHtml(content?: string | null) {
  const trimmed = content?.trim();
  if (!trimmed) return null;

  const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (hasHtmlTag) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function humanizeAxiosError(err: AxiosError<ErrorPayload>) {
  const status = err.response?.status;
  
  if (err.code === "ECONNABORTED") return "Tempo limite excedido. Tente novamente.";
  
  if (status === 400) {
    const data = err.response?.data;
    const msg = data?.erro ? String(data.erro) : data?.message ? String(data.message) : "Dados inválidos.";
    return `${msg} (Confira título e conteúdo)`;
  }
  
  if (status === 401) return "Sessão expirada. Faça login novamente.";
  if (status === 403) return "Sem permissão (Admin/Editor necessário).";
  
  return "Erro inesperado ao processar a solicitação.";
}

// === IMAGE HELPERS ===

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

export async function createImage(url: string): Promise<HTMLImageElement> {
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
  pixelCrop: CropArea,
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
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Falha ao gerar Blob"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export async function filterImagesByMinSize(files: File[], minW: number, minH: number) {
  const checks = await Promise.all(
    files.map(async (file) => {
      try {
        const { w, h } = await getImageSize(file);
        const ok = w >= minW && h >= minH;
        return { file, ok, w, h };
      } catch {
        return { file, ok: false, w: 0, h: 0 };
      }
    })
  );
  return {
    accepted: checks.filter((c) => c.ok).map((c) => c.file),
    rejected: checks.filter((c) => !c.ok),
  };
}