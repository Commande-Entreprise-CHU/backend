import { Router } from "express";
import {
  createChu,
  getChus,
  getChuById,
  updateChu,
  deleteChu,
} from "../controllers/chuController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getChus);
router.get("/:id", authenticateToken, getChuById);

router.post("/", authenticateToken, isAdmin, createChu);
router.put("/:id", authenticateToken, isAdmin, updateChu);
router.delete("/:id", authenticateToken, isAdmin, deleteChu);

export default router;
