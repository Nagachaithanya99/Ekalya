import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireUser from "../middleware/requireUser.js";
import requireRole from "../middleware/requireRole.js";

import {
  adminListPaymentRequests,
  adminApprovePaymentRequest,
  adminRejectPaymentRequest,
} from "../controllers/paymentRequestController.js";

const router = express.Router();

// ✅ Admin only
router.get(
  "/requests",
  requireAuth,
  requireUser,
  requireRole("admin"),
  adminListPaymentRequests
);

router.post(
  "/requests/:id/approve",
  requireAuth,
  requireUser,
  requireRole("admin"),
  adminApprovePaymentRequest
);

router.post(
  "/requests/:id/reject",
  requireAuth,
  requireUser,
  requireRole("admin"),
  adminRejectPaymentRequest
);

export default router;
