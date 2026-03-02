import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  enrollCourse,
  getMyCourses,
  getLessonProgress,
  saveLessonProgress,
} from "../controllers/enrollmentController.js";

const router = express.Router();

// enroll
router.post("/enroll", requireAuth, enrollCourse);

// my courses
router.get("/my", requireAuth, getMyCourses);

// ✅ lesson resume
router.get("/lesson-progress/:courseId/:lessonId", requireAuth, getLessonProgress);

// ✅ save watching progress
router.post("/lesson-progress", requireAuth, saveLessonProgress);

export default router;
