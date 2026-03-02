import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import {
  enrollCourse,
  completeLesson,
  startQuiz,
  submitQuiz,
  startFinalQuiz,
  submitFinalQuiz,
  registerFinalQuizViolation,
  getAvailableCertificateTemplates,
  selectCertificateTemplate,
  downloadCertificate,
} from "../controllers/studentLearningController.js";

const router = express.Router();

router.use(requireAuth, requireRole("student"));

router.post("/courses/:id/enroll", enrollCourse);
router.post("/courses/:id/lessons/:lessonId/complete", completeLesson);

router.post("/quizzes/:quizId/start", startQuiz);
router.post("/quizzes/:quizId/submit", submitQuiz);

router.post("/courses/:id/final-quiz/start", startFinalQuiz);
router.post("/courses/:id/final-quiz/submit", submitFinalQuiz);
router.post("/courses/:id/final-quiz/violation", registerFinalQuizViolation);

router.get("/courses/:id/certificate/templates", getAvailableCertificateTemplates);
router.post("/courses/:id/certificate/select-template", selectCertificateTemplate);
router.get("/courses/:id/certificate/download", downloadCertificate);

export default router;
