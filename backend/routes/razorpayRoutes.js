import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireUser from "../middleware/requireUser.js";
import {
  getPaymentBill,
  getMyPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/razorpayController.js";

const router = express.Router();

// ✅ MUST attach DB user for req.user._id
router.get("/my", requireAuth, requireUser, getMyPayments);
router.get("/bill/:courseId", requireAuth, requireUser, getPaymentBill);
router.post("/razorpay/order", requireAuth, requireUser, createRazorpayOrder);
router.post("/razorpay/verify", requireAuth, requireUser, verifyRazorpayPayment);

export default router;
