import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";

import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  featureCourse,
  unfeatureCourse,
} from "../controllers/courseController.js";

const router = express.Router();

/* ===================== PUBLIC ===================== */

// Get all published courses
router.get("/", getCourses);

// Get single published course
router.get("/:id", getCourseById);

/* ===================== ADMIN ===================== */

// Create course
router.post("/", requireAuth, requireRole("admin"), createCourse);

// Update course
router.put("/:id", requireAuth, requireRole("admin"), updateCourse);

// Delete course
router.delete("/:id", requireAuth, requireRole("admin"), deleteCourse);

// Publish course
router.patch(
  "/:id/publish",
  requireAuth,
  requireRole("admin"),
  publishCourse
);

// Unpublish course
router.patch(
  "/:id/unpublish",
  requireAuth,
  requireRole("admin"),
  unpublishCourse
);

// ⭐ Feature course
router.patch(
  "/:id/feature",
  requireAuth,
  requireRole("admin"),
  featureCourse
);

// ❌ Unfeature course
router.patch(
  "/:id/unfeature",
  requireAuth,
  requireRole("admin"),
  unfeatureCourse
);

export default router;
