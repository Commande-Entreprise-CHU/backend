import { Router } from "express";
import {
  createPatient,
  searchPatients,
  getPatientById,
  updatePatientSection,
  deletePatient,
  updatePatientCore,
} from "../controllers/patientController";
import { authenticateToken } from "../middleware/authMiddleware";
import { auditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

router.use(authenticateToken);

router.post("/patient", auditMiddleware("CREATE_PATIENT"), createPatient);
router.get("/search", auditMiddleware("SEARCH_PATIENTS"), searchPatients);
router.get("/patient/:id", auditMiddleware("READ_PATIENT"), getPatientById);
router.put(
  "/patient/:id",
  auditMiddleware("UPDATE_PATIENT"),
  updatePatientSection
);
router.put(
  "/patient/:id/core",
  auditMiddleware("UPDATE_PATIENT_CORE"),
  updatePatientCore
);
router.delete("/patient/:id", auditMiddleware("DELETE_PATIENT"), deletePatient);

export default router;
