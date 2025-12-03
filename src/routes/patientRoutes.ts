import { Router } from "express";
import {
  createPatient,
  searchPatients,
  getPatientById,
  updatePatientSection,
  updatePreConsult,
  updatePreOp,
  updatePostOp3,
  updatePostOp6,
} from "../controllers/patientController";

const router = Router();

router.post("/patient", createPatient);
router.get("/search", searchPatients);
router.get("/patient/:id", getPatientById);
router.put("/patient/:id", updatePatientSection);

router.put("/patient/:id/preconsult", updatePreConsult);
router.put("/patient/:id/preop", updatePreOp);
router.put("/patient/:id/postop3", updatePostOp3);
router.put("/patient/:id/postop6", updatePostOp6);

export default router;
