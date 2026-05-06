import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware";
import { optionalAuthMiddleware } from "../../middlewares/optionalAuthMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { shopGuestAuthMiddleware } from "../../middlewares/shopGuestAuthMiddleware";
import { shopAdminRoles, shopController } from "./shop.controller";
import { shopMediaController } from "./shopMedia.controller";
import { shopCoverUpload, shopGalleryUpload } from "./shop.files";

const router = Router();

// --- Público (vitrine + checkout) ---
router.get("/shop/public/categories", shopController.listPublicCategories);
router.get("/shop/public/products", shopController.listPublicProducts);
router.get("/shop/public/products/featured", shopController.listPublicFeatured);
router.get("/shop/public/products/slug/:slug", shopController.getPublicProductBySlug);
router.post(
  "/shop/public/orders",
  optionalAuthMiddleware,
  shopController.createPublicOrder
);

router.post("/shop/public/guest-orders/request-code", shopController.requestGuestShopOrderCode);
router.post("/shop/public/guest-orders/verify-code", shopController.verifyGuestShopOrderCode);
router.get("/shop/public/guest-orders", shopGuestAuthMiddleware, shopController.listGuestShopOrders);
router.get("/shop/public/guest-orders/:id", shopGuestAuthMiddleware, shopController.getGuestShopOrder);

// --- Admin ---
const admin = [authMiddleware, roleMiddleware([...shopAdminRoles])];

router.post(
  "/shop-media/tmp/cover",
  ...admin,
  shopCoverUpload.single("cover"),
  shopMediaController.tmpUploadCover
);
router.post(
  "/shop-media/tmp/gallery",
  ...admin,
  shopGalleryUpload.array("images", 12),
  shopMediaController.tmpUploadGallery
);
router.delete("/shop-media/tmp/:tmpId", ...admin, shopMediaController.deleteTmp);

router.get("/shop/admin/categories", ...admin, shopController.listAdminCategories);

router.get("/shop/admin/products", ...admin, shopController.listAdminProducts);
router.post("/shop/admin/products", ...admin, shopController.createAdminProduct);
router.get("/shop/admin/products/:id", ...admin, shopController.getAdminProduct);
router.patch("/shop/admin/products/:id", ...admin, shopController.updateAdminProduct);
router.delete("/shop/admin/products/:id", ...admin, shopController.deleteAdminProduct);

router.get("/shop/admin/orders", ...admin, shopController.listAdminOrders);
router.get("/shop/admin/orders/:id", ...admin, shopController.getAdminOrder);
router.patch("/shop/admin/orders/:id/status", ...admin, shopController.updateAdminOrderStatus);

export default router;
