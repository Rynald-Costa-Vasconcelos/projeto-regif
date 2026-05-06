import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/auth/verify-user", authController.verifyUser);
router.post("/auth/setup", authController.setup);
router.post("/auth/login", authController.login);
router.get("/auth/invites/:token", authController.getInviteDetails);
router.post("/auth/invites/:token/accept", authController.acceptInvite);

export default router;
