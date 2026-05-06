import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

import { adminUserController } from "./adminUser.controller";

const router = Router();

// Protege tudo do módulo: somente ADMIN
router.use(authMiddleware, roleMiddleware(["ADMIN"]));

router.get("/roles", adminUserController.listRoles);

router.post("/invites", adminUserController.createInvite);
router.get("/invites", adminUserController.listInvites);
router.delete("/invites/:id", adminUserController.revokeInvite);

router.get("/users", adminUserController.listUsers);
router.get("/users/:id", adminUserController.getUserById);
router.patch("/users/:id/role", adminUserController.updateUserRole);
router.patch("/users/:id/status", adminUserController.updateUserStatus);

export default router;
