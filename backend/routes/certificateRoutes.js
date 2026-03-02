import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  getCertificateTemplates,
  getMyAllCertificates,
  getMyCertificates,
  selectCertificateTemplate,
} from "../controllers/certificateController.js";

const router = express.Router();

router.get("/templates", requireAuth, getCertificateTemplates);
router.get("/mine", requireAuth, getMyAllCertificates);
router.post("/select-template", requireAuth, selectCertificateTemplate);

// student - published only
router.get("/my", requireAuth, getMyCertificates);

export default router;
