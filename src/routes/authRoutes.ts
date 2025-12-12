import { Router } from "express";
import {
  login,
  register,
  getMe,
  getPendingUsers,
  approveUser,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import { auditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

router.post("/login", auditMiddleware("LOGIN"), login);
router.post("/register", auditMiddleware("REGISTER"), register);
router.get("/me", authenticateToken, auditMiddleware("GET_ME"), getMe);

// Admin routes
router.get(
  "/pending",
  authenticateToken,
  auditMiddleware("LIST_PENDING_USERS"),
  getPendingUsers
);
router.post(
  "/approve/:userId",
  authenticateToken,
  auditMiddleware("APPROVE_USER"),
  approveUser
);

export default router;
