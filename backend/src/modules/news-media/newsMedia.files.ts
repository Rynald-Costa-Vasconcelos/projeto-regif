import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import sharp from "sharp";

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
export const NEWS_UPLOAD_ROOT = path.resolve(UPLOADS_DIR, "news");

export const DIR_COVERS = path.join(NEWS_UPLOAD_ROOT, "covers");
export const DIR_GALLERY = path.join(NEWS_UPLOAD_ROOT, "gallery");
export const DIR_THUMBS = path.join(NEWS_UPLOAD_ROOT, "thumbs");

export const DIR_TMP_NEWS = path.join(NEWS_UPLOAD_ROOT, "tmp", "news"); // uploads/news/tmp/news/<tmpId>/

export const URL_BASE = "/uploads/news";

export type ImageSavedMeta = {
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: "image/webp";
};

export async function ensureDirs() {
  await fs.mkdir(DIR_COVERS, { recursive: true });
  await fs.mkdir(DIR_GALLERY, { recursive: true });
  await fs.mkdir(DIR_THUMBS, { recursive: true });
  await fs.mkdir(DIR_TMP_NEWS, { recursive: true });
}

export function randomName(ext = "webp") {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
}

export async function toWebpAndSave(input: Buffer, outPath: string): Promise<ImageSavedMeta> {
  const img = sharp(input).rotate();
  const meta = await img.metadata();

  const webpBuffer = await img.webp({ quality: 80 }).toBuffer();
  await fs.writeFile(outPath, webpBuffer);

  return {
    width: meta.width ?? null,
    height: meta.height ?? null,
    sizeBytes: webpBuffer.length,
    mimeType: "image/webp",
  };
}

export async function makeThumb(input: Buffer, outPath: string) {
  const thumbBuffer = await sharp(input)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  await fs.writeFile(outPath, thumbBuffer);
  return thumbBuffer.length;
}

export async function readImageMeta(buf: Buffer) {
  const meta = await sharp(buf).rotate().metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

export function urlToDiskPath(url?: string | null) {
  if (!url) return null;
  if (!url.startsWith(URL_BASE)) return null;
  const rel = url.replace(URL_BASE + "/", "");
  return path.join(NEWS_UPLOAD_ROOT, rel);
}

export async function safeUnlink(p: string) {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

export async function ensureTmpDir(tempAssetId: string) {
  const dir = path.join(DIR_TMP_NEWS, tempAssetId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
