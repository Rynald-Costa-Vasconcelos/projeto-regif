import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const MB = 1024 * 1024;

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato inválido. Use JPG, PNG ou WEBP."));
  }
};

export const newsCoverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * MB, files: 1 },
  fileFilter: imageFilter,
});

export const newsGalleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * MB, files: 12 },
  fileFilter: imageFilter,
});

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export const NEWS_UPLOAD_ROOT = path.resolve(UPLOADS_DIR, "news");
export const NEWS_DIR_COVERS = path.join(NEWS_UPLOAD_ROOT, "covers");
export const NEWS_DIR_GALLERY = path.join(NEWS_UPLOAD_ROOT, "gallery");
export const NEWS_DIR_THUMBS = path.join(NEWS_UPLOAD_ROOT, "thumbs");

export const URL_NEWS_BASE = "/uploads/news";

export async function ensureNewsDirs() {
  await fs.mkdir(NEWS_DIR_COVERS, { recursive: true });
  await fs.mkdir(NEWS_DIR_GALLERY, { recursive: true });
  await fs.mkdir(NEWS_DIR_THUMBS, { recursive: true });
}

export function toRelativeUploadsPath(urlOrPath: string) {
  if (!urlOrPath) return null;

  let p = String(urlOrPath).trim();

  try {
    if (p.startsWith("http://") || p.startsWith("https://")) {
      p = new URL(p).pathname;
    }
  } catch {}

  p = p.replace(/\\/g, "/");

  if (p.startsWith("/uploads/")) return p.slice("/uploads/".length);
  if (p.startsWith("uploads/")) return p.slice("uploads/".length);

  return p.startsWith("/") ? p.slice(1) : p;
}

export async function safeUnlink(absPath: string) {
  try {
    await fs.unlink(absPath);
  } catch (err: any) {
    if (err?.code === "ENOENT") return;
    console.error("[news] Falha ao remover arquivo:", absPath, err);
  }
}

export async function safeRename(from: string, to: string) {
  await fs.mkdir(path.dirname(to), { recursive: true });

  try {
    await fs.rename(from, to);
  } catch (err: any) {
    if (err?.code === "EXDEV") {
      await fs.copyFile(from, to);
      await fs.unlink(from);
    } else {
      throw err;
    }
  }
}

export function randomWebpName(prefix?: string) {
  const stamp = Date.now();
  const hex = crypto.randomBytes(8).toString("hex");
  return `${prefix ? `${prefix}-` : ""}${stamp}-${hex}.webp`;
}

export function absFromUploads(relPath: string) {
  return path.resolve(UPLOADS_DIR, relPath);
}
