import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../utils/upload.js";

import {
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonController.js";

const router = express.Router();

/**
 * STUDENT / PUBLIC (logged-in)
 * GET /api/lessons/course/:courseId
 */
router.get("/course/:courseId", requireAuth, getLessonsByCourse);

/**
 * ADMIN
 * POST /api/lessons
 * multipart/form-data (video file or videoUrl)
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  upload.single("video"),
  createLesson
);

/**
 * ADMIN
 * PUT /api/lessons/:id
 */
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  upload.single("video"), // ✅ ADD THIS
  updateLesson
);

/**
 * ADMIN
 * DELETE /api/lessons/:id
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  deleteLesson
);

export default router;
