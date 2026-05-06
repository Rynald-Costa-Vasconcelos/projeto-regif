import path from "path";
import fs from "fs/promises";

// ✅ Deve bater com documentMulter.ts (fora do dist)
export const DOCUMENTS_UPLOAD_ROOT = path.resolve(process.cwd(), "uploads", "documents");
export const URL_BASE = "/uploads/documents";

// Monta fileUrl pública a partir de um filePath absoluto salvo pelo multer
export function buildFileUrlFromAbsolutePath(filePathAbs: string) {
  const rel = path
    .relative(DOCUMENTS_UPLOAD_ROOT, filePathAbs)
    .split(path.sep)
    .join("/");
  return `${URL_BASE}/${rel}`;
}

export function isSafeDocumentPath(filePathAbs: string) {
  const resolved = path.resolve(filePathAbs);
  return resolved.startsWith(DOCUMENTS_UPLOAD_ROOT + path.sep) || resolved === DOCUMENTS_UPLOAD_ROOT;
}

// ✅ Helpers de cleanup de pastas vazias (YYYY/MM e YYYY)
async function removeDirIfEmpty(dirAbs: string) {
  try {
    const entries = await fs.readdir(dirAbs);
    if (entries.length === 0) {
      await fs.rmdir(dirAbs);
      return true;
    }
  } catch {
    // ignora
  }
  return false;
}

export async function cleanupEmptyDocumentFolders(fileAbsPath: string) {
  try {
    if (!fileAbsPath || !isSafeDocumentPath(fileAbsPath)) return;

    // começa na pasta do arquivo (.../documents/YYYY/MM)
    let currentDir = path.dirname(path.resolve(fileAbsPath));
    const rootDir = path.resolve(DOCUMENTS_UPLOAD_ROOT);

    while (true) {
      const currentResolved = path.resolve(currentDir);

      // não remove a raiz /uploads/documents
      if (currentResolved === rootDir) break;

      const removed = await removeDirIfEmpty(currentResolved);
      if (!removed) break; // se não está vazio, para

      currentDir = path.dirname(currentResolved);
    }
  } catch {
    // cleanup nunca deve derrubar fluxo
  }
}

export async function safeUnlinkDocumentFile(filePathAbs?: string | null) {
  try {
    if (!filePathAbs) return;
    if (!isSafeDocumentPath(filePathAbs)) return;

    await fs.unlink(filePathAbs);
    await cleanupEmptyDocumentFolders(filePathAbs);
  } catch {
    // se já não existir / falhar, não derruba fluxo
  }
}
