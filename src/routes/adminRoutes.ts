import { Router } from "express";
import {
  getUsers,
  updateUserStatus,
  updateUserChu,
} from "../controllers/adminController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";
import { auditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

router.use(authenticateToken, isAdmin);

// HDS: All admin actions are audited for traceability
router.get("/users", auditMiddleware("LIST_USERS"), getUsers);
router.patch("/users/:id/status", auditMiddleware("UPDATE_USER_STATUS"), updateUserStatus);
router.patch("/users/:id/chu", auditMiddleware("UPDATE_USER_CHU"), updateUserChu);

export default router;
