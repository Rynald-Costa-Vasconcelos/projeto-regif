import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { boardController } from "./board.controller";

const router = Router();

// ======================================================
// PÚBLICO (Transparência)
// ======================================================
router.get("/board/public", boardController.listPublic);
router.get("/board/public/stream", boardController.sse);

// ======================================================
// ADMIN / EDITOR (Gestão de Pessoal)
// ======================================================
const admin = [authMiddleware, roleMiddleware(["ADMIN", "EDITOR"])];

router.get("/board/admin/snapshot", ...admin, boardController.getAdminSnapshot);
router.get("/board/admin/roles", ...admin, boardController.listRoles);

router.get("/board/admin/members", ...admin, boardController.listMembers);
router.post("/board/admin/members", ...admin, boardController.createMember);
router.patch("/board/admin/members/:id", ...admin, boardController.updateMember);

router.get("/board/admin/mandates/current", ...admin, boardController.getCurrentMandate);
router.patch("/board/admin/mandates/:id", ...admin, boardController.updateMandate);

// Drag & Drop (atribuir/remover)
router.post("/board/admin/assign", ...admin, boardController.assign);

// Vacância (Art. 23) — declaração via portaria (número opcional por enquanto)
router.post("/board/admin/roles/:roleId/vacancy", ...admin, boardController.declareVacancy);

router.get("/board/admin/vacancy-alerts", ...admin, boardController.vacancyAlerts);

export default router;

