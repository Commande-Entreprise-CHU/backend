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

const router = Router();

router.get("/types", getConsultationTypes);
router.post("/types", createConsultationType);
router.put("/types/:id", updateConsultationType);

router.get("/types/:typeId/templates", getTemplatesByType);
router.post("/types/:typeId/templates", createTemplateVersion);

router.put("/:templateId/active", setActiveTemplate);
router.delete("/:templateId", deleteTemplateVersion);

router.get("/active/:slug", getActiveTemplateByType);

export default router;
