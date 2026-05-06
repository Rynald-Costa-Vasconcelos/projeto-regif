import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/users.routes";
import newsRoutes from "../modules/news/news.routes";
import adminUserRoutes from "../modules/admin-users/adminUser.routes";
import documentsRoutes from "../modules/documents/documents.routes";
import shopRoutes from "../modules/shop/shop.routes";
import boardRoutes from "../modules/board/board.routes";

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(newsRoutes);

router.use("/admin", adminUserRoutes);
router.use(documentsRoutes);
router.use(shopRoutes);
router.use(boardRoutes);

export { router };
