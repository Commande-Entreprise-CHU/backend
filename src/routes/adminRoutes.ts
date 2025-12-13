import { Router } from "express";
import {
  getUsers,
  updateUserStatus,
  updateUserChu,
  updateUserRole,
} from "../controllers/adminController";
import { authenticateToken, isChuAdminOrMaster, isMasterAdmin } from "../middleware/authMiddleware";
import { auditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Routes accessible by both CHU Admin and Master Admin
router.get("/users", isChuAdminOrMaster, auditMiddleware("LIST_USERS"), getUsers);
router.patch("/users/:id/status", isChuAdminOrMaster, auditMiddleware("UPDATE_USER_STATUS"), updateUserStatus);
router.patch("/users/:id/role", isChuAdminOrMaster, auditMiddleware("UPDATE_USER_ROLE"), updateUserRole);

// Routes accessible by Master Admin only
router.patch("/users/:id/chu", isMasterAdmin, auditMiddleware("UPDATE_USER_CHU"), updateUserChu);

export default router;

