import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getQuiz, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

// ✅ GET /api/quizzes?courseId=...&lessonId=...
router.get("/", requireAuth, getQuiz);

// ✅ POST /api/quizzes/submit
router.post("/submit", requireAuth, submitQuiz);

export default router;
