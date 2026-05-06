import { Router } from "express";

import { newsController } from "./news.controller";
import { newsMediaController } from "../news-media/newsMedia.controller";

import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

import { newsCoverUpload, newsGalleryUpload } from "./news.files";

const router = Router();

router.get("/news/public", newsController.listPublic);
router.get("/news/public/categories", newsController.listPublicCategories);
router.get("/news/slug/:slug", newsController.getBySlug);

router.get(
  "/news",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.listAdmin
);

router.post(
  "/news",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.create
);

router.get(
  "/news/categories",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.listCategories
);

router.get(
  "/news/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.getById
);

router.patch(
  "/news/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.update
);

router.patch(
  "/news/:id/status",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsController.updateStatus
);

router.delete(
  "/news/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  newsController.delete
);

router.post(
  "/news-media/tmp/cover",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsCoverUpload.single("cover"),
  newsMediaController.tmpUploadCover
);

router.post(
  "/news-media/tmp/gallery",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsGalleryUpload.array("images", 12),
  newsMediaController.tmpUploadGallery
);

router.delete(
  "/news-media/tmp/:tmpId",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsMediaController.deleteTmp
);

router.post(
  "/news/:id/cover",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsCoverUpload.single("cover"),
  newsMediaController.uploadCover
);

router.post(
  "/news/:id/gallery",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsGalleryUpload.array("images", 12),
  newsMediaController.uploadGallery
);

router.put(
  "/news/:id/links",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsMediaController.replaceLinks
);

router.delete(
  "/news/:id/gallery/:assetId",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsMediaController.deleteGalleryAsset
);

router.delete(
  "/news/:id/cover",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  newsMediaController.deleteCover
);

export default router;
