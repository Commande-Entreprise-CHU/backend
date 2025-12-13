import { Router } from "express";
import { getDashboardStats, getMyRecentPatients } from "../controllers/statsController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getDashboardStats);
router.get("/user/recent-patients", authenticateToken, getMyRecentPatients);

export default router;
