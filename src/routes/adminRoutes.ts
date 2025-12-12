import { Router } from "express";
import {
  getUsers,
  updateUserStatus,
  updateUserChu,
} from "../controllers/adminController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken, isAdmin);

router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/chu", updateUserChu);

export default router;
