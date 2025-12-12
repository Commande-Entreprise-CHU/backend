import { Router } from "express";
import {
  getConsultationTypes,
  createConsultationType,
  updateConsultationType,
  getTemplatesByType,
  createTemplateVersion,
  setActiveTemplate,
  getActiveTemplateByType,
  deleteTemplateVersion,
} from "../controllers/templateController";
import { authenticateToken } from "../middleware/authMiddleware";
import { auditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

router.use(authenticateToken);

router.get(
  "/types",
  auditMiddleware("READ_CONSULTATION_TYPES"),
  getConsultationTypes
);
router.post(
  "/types",
  auditMiddleware("CREATE_CONSULTATION_TYPE"),
  createConsultationType
);
router.put(
  "/types/:id",
  auditMiddleware("UPDATE_CONSULTATION_TYPE"),
  updateConsultationType
);

router.get(
  "/types/:typeId/templates",
  auditMiddleware("READ_TEMPLATES"),
  getTemplatesByType
);
router.post(
  "/types/:typeId/templates",
  auditMiddleware("CREATE_TEMPLATE"),
  createTemplateVersion
);

router.put(
  "/:templateId/active",
  auditMiddleware("ACTIVATE_TEMPLATE"),
  setActiveTemplate
);
router.delete(
  "/:templateId",
  auditMiddleware("DELETE_TEMPLATE"),
  deleteTemplateVersion
);

router.get(
  "/active/:slug",
  auditMiddleware("READ_ACTIVE_TEMPLATE"),
  getActiveTemplateByType
);

// Route compatible with frontend call /types/:slug/active
router.get(
  "/types/:slug/active",
  auditMiddleware("READ_ACTIVE_TEMPLATE"),
  getActiveTemplateByType
);

export default router;
