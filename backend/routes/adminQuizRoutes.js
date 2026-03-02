import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  createQuiz,
  generateQuizQuestions,
  getQuizzesByCourse,
  deleteQuiz,
  updateQuiz,
} from "../controllers/adminQuizController.js";

const router = express.Router();

router.post("/", requireAuth, requireAdmin, createQuiz);
router.post("/generate", requireAuth, requireAdmin, generateQuizQuestions);
router.get("/:courseId", requireAuth, requireAdmin, getQuizzesByCourse);
router.put("/:id", requireAuth, requireAdmin, updateQuiz);
router.delete("/:id", requireAuth, requireAdmin, deleteQuiz);

export default router;
