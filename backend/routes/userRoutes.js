import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { getMe, updateMyRole } from "../controllers/userController.js";

const router = express.Router();

// Logged-in user details (role comes from DB)
router.get("/me", requireAuth, getMe);

// Optional: admin can update own role (or later extend to manage others)
router.patch("/me/role", requireAuth, requireAdmin, updateMyRole);

export default router;
