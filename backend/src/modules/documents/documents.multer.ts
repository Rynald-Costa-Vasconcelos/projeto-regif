import multer from "multer";
import path from "path";
import fs from "fs";

// ======================================================
// PATH ROOT DO MÓDULO DOCUMENTS
// ======================================================

// uploads/documents
const DOCUMENTS_UPLOAD_ROOT = path.resolve(
  process.cwd(),
  "uploads",
  "documents"
);

// Garante que a pasta existe
function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ======================================================
// STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Organiza por ano/mês (ex: 2026/01)
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const uploadDir = path.join(DOCUMENTS_UPLOAD_ROOT, year, month);
    ensureDirExists(uploadDir);

    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "")
      .toLowerCase();

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${baseName}-${unique}${ext}`);
  },
});

// ======================================================
// FILE FILTER (APENAS PDF)
// ======================================================

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de arquivo inválido. Apenas arquivos PDF são permitidos.")
    );
  }
};

// ======================================================
// EXPORT
// ======================================================

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter,
});
