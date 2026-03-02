import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createPaymentRequest,
  myPaymentRequests,
} from "../controllers/paymentRequestController.js";

const router = express.Router();

router.post("/", requireAuth, createPaymentRequest);
router.get("/my", requireAuth, myPaymentRequests);

export default router;
