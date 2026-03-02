// backend/routes/adminRoutes.js
import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

/* ===================== CERTIFICATES ===================== */
import {
  getAllCertificatesAdmin,
  getCertificatesDirectoryAdmin,
  publishCertificate,
  unpublishCertificate,
} from "../controllers/certificateController.js";

/* ===================== COURSES ===================== */
import {
  getAllCoursesAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  featureCourse,
  unfeatureCourse,
} from "../controllers/courseController.js";

/* ===================== BLOGS ===================== */
import {
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from "../controllers/blogController.js";

/* ===================== CONTACT MESSAGES ===================== */
import {
  getAllMessages,
  markRead,
  deleteMessage,
} from "../controllers/contactController.js";

/* ===================== STUDENTS ===================== */
import {
  getStudentsProgress,
  getStudentsDirectory,
} from "../controllers/adminController.js";

const router = express.Router();

/* ===================== COURSES ===================== */
router.get("/courses", requireAuth, requireAdmin, getAllCoursesAdmin);
router.post("/courses", requireAuth, requireAdmin, createCourse);
router.put("/courses/:id", requireAuth, requireAdmin, updateCourse);
router.delete("/courses/:id", requireAuth, requireAdmin, deleteCourse);

router.patch("/courses/:id/publish", requireAuth, requireAdmin, publishCourse);
router.patch("/courses/:id/unpublish", requireAuth, requireAdmin, unpublishCourse);

// ✅ NEW: FEATURED ON HOME
router.patch("/courses/:id/feature", requireAuth, requireAdmin, featureCourse);
router.patch("/courses/:id/unfeature", requireAuth, requireAdmin, unfeatureCourse);

/* ===================== BLOGS ===================== */
router.get("/blogs", requireAuth, requireAdmin, getAllBlogsAdmin);
router.post("/blogs", requireAuth, requireAdmin, createBlog);
router.put("/blogs/:id", requireAuth, requireAdmin, updateBlog);
router.delete("/blogs/:id", requireAuth, requireAdmin, deleteBlog);
router.patch("/blogs/:id/publish", requireAuth, requireAdmin, publishBlog);
router.patch("/blogs/:id/unpublish", requireAuth, requireAdmin, unpublishBlog);

/* ===================== MESSAGES ===================== */
router.get("/messages", requireAuth, requireAdmin, getAllMessages);
router.patch("/messages/:id/read", requireAuth, requireAdmin, markRead);
router.delete("/messages/:id", requireAuth, requireAdmin, deleteMessage);

/* ===================== CERTIFICATES ===================== */
router.get("/certificates", requireAuth, requireAdmin, getAllCertificatesAdmin);
router.get(
  "/certificates-directory",
  requireAuth,
  requireAdmin,
  getCertificatesDirectoryAdmin
);
router.patch(
  "/certificates/:id/publish",
  requireAuth,
  requireAdmin,
  publishCertificate
);
router.patch(
  "/certificates/:id/unpublish",
  requireAuth,
  requireAdmin,
  unpublishCertificate
);

/* ===================== STUDENTS ===================== */
router.get("/students", requireAuth, requireAdmin, getStudentsProgress);
router.get(
  "/students-directory",
  requireAuth,
  requireAdmin,
  getStudentsDirectory
);

export default router;
