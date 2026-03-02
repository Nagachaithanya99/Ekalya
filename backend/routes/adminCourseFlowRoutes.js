import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import {
  createCourse,
  updateCourse,
} from "../controllers/courseController.js";
import {
  finalizeLessons,
  addLessonAfterFinalize,
  finalizeQuizzes,
  publishCourseFlow,
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  updateAllowedTemplates,
} from "../controllers/adminCourseFlowController.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.post("/courses/:id/finalize-lessons", finalizeLessons);
router.post("/courses/:id/add-lesson", addLessonAfterFinalize);
router.post("/courses/:id/finalize-quizzes", finalizeQuizzes);
router.post("/courses/:id/publish", publishCourseFlow);
router.put("/courses/:id/allowed-templates", updateAllowedTemplates);

router.get("/templates", listTemplates);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

export default router;
