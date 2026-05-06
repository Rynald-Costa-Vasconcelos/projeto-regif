import { Router } from "express";

import { usersController } from "./users.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/users/me", authMiddleware, usersController.me);

export default router;
