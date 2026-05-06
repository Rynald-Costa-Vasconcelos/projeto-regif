import { Router } from "express";
import { documentController } from "./documents.controller";

import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

// Upload de PDF (multer do próprio módulo)
import { documentUpload } from "./documents.multer";

const router = Router();

// ======================================================
// PÚBLICO
// ======================================================

router.get("/documents/public", documentController.listPublic);
router.get(
  "/documents/public/categories",
  documentController.listPublicCategories
);
router.get("/documents/slug/:slug", documentController.getBySlug);
router.get(
  "/documents/slug/:slug/download",
  documentController.downloadBySlug
);

// ======================================================
// ADMIN / EDITOR
// ======================================================

router.get(
  "/documents",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentController.listAdmin
);

router.get(
  "/documents/categories",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentController.listCategories
);

router.post(
  "/documents/categories",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  documentController.createCategory
);

router.patch(
  "/documents/categories/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  documentController.updateCategory
);

router.delete(
  "/documents/categories/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  documentController.deleteCategory
);

router.post(
  "/documents",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentUpload.single("file"),
  documentController.create
);

router.get(
  "/documents/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentController.getById
);

router.patch(
  "/documents/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentController.update
);

router.patch(
  "/documents/:id/status",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  documentController.updateStatus
);

router.delete(
  "/documents/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  documentController.delete
);

export default router;
