import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import upload from "../utils/upload.js";
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

/**
 * ✅ Student upload for payment proof
 * POST /api/upload/payment-proof
 * Body: form-data { file }
 */
router.post(
  "/payment-proof",
  requireAuth,
  upload.single("file"),
  uploadFile
);

/**
 * ✅ Admin upload (existing)
 * POST /api/upload
 */
router.post("/", requireAuth, requireAdmin, upload.single("file"), uploadFile);

export default router;
