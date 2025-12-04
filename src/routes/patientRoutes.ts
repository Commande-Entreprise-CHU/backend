import { Router } from "express";
import {
  createPatient,
  searchPatients,
  getPatientById,
  updatePatientSection,
} from "../controllers/patientController";

const router = Router();

router.post("/patient", createPatient);
router.get("/search", searchPatients);
router.get("/patient/:id", getPatientById);
router.put("/patient/:id", updatePatientSection);

export default router;
