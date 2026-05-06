import multer from "multer";

const MB = 1024 * 1024;

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato inválido. Use JPG, PNG ou WEBP."));
  }
};

export const shopCoverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * MB, files: 1 },
  fileFilter: imageFilter,
});

export const shopGalleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * MB, files: 12 },
  fileFilter: imageFilter,
});
