import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import sharp from "sharp";

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
export const SHOP_UPLOAD_ROOT = path.resolve(UPLOADS_DIR, "shop");

/** Imagem principal quadrada (vitrine + capa) */
export const SHOP_COVER_SIZE = 1024;
/** Miniatura quadrada */
export const SHOP_THUMB_SIZE = 400;

export const DIR_SHOP_COVERS = path.join(SHOP_UPLOAD_ROOT, "covers");
export const DIR_SHOP_GALLERY = path.join(SHOP_UPLOAD_ROOT, "gallery");
export const DIR_SHOP_THUMBS = path.join(SHOP_UPLOAD_ROOT, "thumbs");
export const DIR_TMP_SHOP = path.join(SHOP_UPLOAD_ROOT, "tmp", "shop");

export const URL_SHOP_BASE = "/uploads/shop";

export type ImageSavedMeta = {
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: "image/webp";
};

export async function ensureShopMediaDirs() {
  await fs.mkdir(DIR_SHOP_COVERS, { recursive: true });
  await fs.mkdir(DIR_SHOP_GALLERY, { recursive: true });
  await fs.mkdir(DIR_SHOP_THUMBS, { recursive: true });
  await fs.mkdir(DIR_TMP_SHOP, { recursive: true });
}

export function randomShopWebpName(prefix?: string) {
  const stamp = Date.now();
  const hex = crypto.randomBytes(8).toString("hex");
  return `${prefix ? `${prefix}-` : ""}${stamp}-${hex}.webp`;
}

export async function readImageMeta(buf: Buffer) {
  const meta = await sharp(buf).rotate().metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Salva imagem quadrada (recorte central) em WebP. */
export async function toSquareWebpAndSave(
  input: Buffer,
  outPath: string,
  size: number
): Promise<ImageSavedMeta> {
  const webpBuffer = await sharp(input)
    .rotate()
    .resize(size, size, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  await fs.writeFile(outPath, webpBuffer);
  return {
    width: size,
    height: size,
    sizeBytes: webpBuffer.length,
    mimeType: "image/webp",
  };
}

export async function makeSquareThumb(input: Buffer, outPath: string, size: number) {
  const thumbBuffer = await sharp(input)
    .rotate()
    .resize(size, size, { fit: "cover", position: "centre" })
    .webp({ quality: 76 })
    .toBuffer();
  await fs.writeFile(outPath, thumbBuffer);
  return thumbBuffer.length;
}

export async function ensureShopTmpDir(tempAssetId: string) {
  const dir = path.join(DIR_TMP_SHOP, tempAssetId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function shopUrlToDiskPath(url?: string | null) {
  if (!url) return null;
  if (!url.startsWith(URL_SHOP_BASE)) return null;
  const rel = url.replace(URL_SHOP_BASE + "/", "");
  return path.join(SHOP_UPLOAD_ROOT, rel);
}

export async function safeUnlinkShop(p: string) {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
