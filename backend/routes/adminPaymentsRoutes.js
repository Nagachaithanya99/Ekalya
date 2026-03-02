import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireUser from "../middleware/requireUser.js";
import requireRole from "../middleware/requireRole.js";
import { adminEnrollmentPaymentsTable } from "../controllers/adminPaymentsController.js";

const router = express.Router();

// ✅ Admin only: Razorpay enrollments + payments table
router.get(
  "/enrollments-table",
  requireAuth,
  requireUser,
  requireRole("admin"),
  adminEnrollmentPaymentsTable
);

export default router;
