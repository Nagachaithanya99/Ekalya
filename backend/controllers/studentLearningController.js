import mongoose from "mongoose";

import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Quiz from "../models/Quiz.js";
import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Enrollment from "../models/Enrollment.js";
import EnrollmentProgress from "../models/EnrollmentProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import generateCertificate from "../utils/generateCertificate.js";

const toObjectId = (v) =>
  mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : null;

const getUserId = (req) => req.user?._id || null;

const scoreQuiz = (quiz, answers) => {
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    const ans = Array.isArray(answers) ? answers[i] : answers?.[i];
    if (Number(ans) === Number(q.correctAnswer)) correct += 1;
  });
  const total = Math.max(quiz.questions.length, 1);
  return Math.round((correct / total) * 100);
};

const ensureEnrollmentProgress = async ({ userId, courseId }) => {
  let row = await EnrollmentProgress.findOne({ userId, courseId });
  if (!row) {
    row = await EnrollmentProgress.create({
      userId,
      courseId,
      completedLessons: [],
      lessonQuizProgress: [],
      finalQuizProgress: {},
      certificate: {},
    });
  }
  return row;
};

const calculateLessonsCompletion = async ({ userId, user, courseId }) => {
  const lessons = await Lesson.find({ courseId, isActive: true }).select("_id");
  const progress = await ensureEnrollmentProgress({ userId, courseId });
  const enrollment = await Enrollment.findOne({ userId, courseId })
    .select("completedLessonIds")
    .lean();

  const completedSet = new Set([
    ...(progress.completedLessons || []).map(String),
    ...((enrollment?.completedLessonIds || []).map(String)),
  ]);
  const allLessonsDone =
    lessons.length > 0 && lessons.every((l) => completedSet.has(String(l._id)));

  const lessonQuizzes = await Quiz.find({
    courseId,
    type: "LESSON",
    lessonId: { $ne: null },
    isFinalized: true,
    "questions.0": { $exists: true },
  })
    .select("_id lessonId")
    .lean();
  const quizPassedMap = new Map(
    (progress.lessonQuizProgress || []).map((q) => [String(q.lessonId), !!q.passed])
  );
  const attemptUserIds = [String(userId), String(user?.clerkId || "")]
    .map((x) => x.trim())
    .filter(Boolean);
  if (lessonQuizzes.length && attemptUserIds.length) {
    const passedAttempts = await QuizAttempt.find({
      userId: { $in: attemptUserIds },
      quizId: { $in: lessonQuizzes.map((q) => q._id) },
      passed: true,
    })
      .select("quizId")
      .lean();

    const passedQuizIds = new Set(passedAttempts.map((a) => String(a.quizId)));
    for (const q of lessonQuizzes) {
      if (passedQuizIds.has(String(q._id))) {
        quizPassedMap.set(String(q.lessonId), true);
      }
    }
  }
  const allLessonQuizzesPassed = lessonQuizzes.every(
    (q) => quizPassedMap.get(String(q.lessonId)) === true
  );

  return { allLessonsDone, allLessonQuizzesPassed, progress };
};

const generateCertNo = (courseId, userId) => {
  const coursePart = String(courseId).slice(-5).toUpperCase();
  const userPart = String(userId).slice(-5).toUpperCase();
  const ts = Date.now().toString().slice(-8);
  return `CERT-${coursePart}-${userPart}-${ts}`;
};

const safeOrigin = () => {
  const backendUrl = String(process.env.BACKEND_URL || "").trim();
  if (backendUrl) return backendUrl.replace(/\/$/, "");
  return `http://localhost:${process.env.PORT || 5000}`;
};

const issueCertificate = async ({ user, course, template }) => {
  const existing = await Certificate.findOne({ userId: user._id, courseId: course._id });
  if (existing) return existing;

  const certNo = generateCertNo(course._id, user._id);
  const certificateId = certNo;
  const issuedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const generated = await generateCertificate({
    certificateId,
    studentName: user.name || user.email,
    studentEmail: user.email || "",
    courseTitle: course.title,
    issuedOn,
    verifyUrl: `${safeOrigin()}/certificates/${certificateId}.pdf`,
    templateKey: template.key,
  });

  const cert = await Certificate.create({
    userId: user._id,
    courseId: course._id,
    certificateId,
    certNo,
    templateId: template._id,
    templateKey: template.key,
    pdfPath: generated.pdfPath,
    pdfUrl: `${safeOrigin()}${generated.pdfPath}`,
    issuedAt: new Date(),
    published: false,
  });

  return cert;
};

export const enrollCourse = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(courseId);
    if (!course || !(course.state === "PUBLISHED" || course.published)) {
      return res.status(404).json({ message: "Published course not found" });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { $setOnInsert: { progressPercent: 0, completed: false } },
      { upsert: true, new: true }
    );
    const progress = await ensureEnrollmentProgress({ userId, courseId });
    res.status(201).json({ message: "Enrolled successfully", progress });
  } catch (err) {
    next(err);
  }
};

export const completeLesson = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    const lessonId = toObjectId(req.params.lessonId);
    if (!courseId || !lessonId) return res.status(400).json({ message: "Invalid ids" });

    const lesson = await Lesson.findOne({ _id: lessonId, courseId, isActive: true });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const userId = getUserId(req);
    const progress = await ensureEnrollmentProgress({ userId, courseId });
    if (!progress.completedLessons.some((id) => String(id) === String(lessonId))) {
      progress.completedLessons.push(lessonId);
      await progress.save();
    }

    const totalLessons = await Lesson.countDocuments({ courseId, isActive: true });
    const completedCount = progress.completedLessons.length;
    const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

    await Enrollment.findOneAndUpdate(
      { userId, courseId },
      {
        $addToSet: { completedLessonIds: lessonId },
        $set: { progressPercent, completed: progressPercent >= 100 },
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Lesson marked complete", progressPercent });
  } catch (err) {
    next(err);
  }
};

export const startQuiz = async (req, res, next) => {
  try {
    const quizId = toObjectId(req.params.quizId);
    if (!quizId) return res.status(400).json({ message: "Invalid quiz id" });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (!quiz.isFinalized) {
      return res.status(400).json({ message: "Quiz is not finalized yet" });
    }

    if (quiz.type === "FINAL") {
      return startFinalQuiz(req, res, next);
    }

    const progress = await ensureEnrollmentProgress({
      userId: getUserId(req),
      courseId: quiz.courseId,
    });

    const lessonState =
      progress.lessonQuizProgress.find((x) => String(x.quizId) === String(quiz._id)) || null;

    const attemptsUsed = Number(lessonState?.attempts || 0);
    const attemptsLeft = Math.max(quiz.maxAttempts - attemptsUsed, 0);
    const locked = !!lessonState?.locked;

    if (locked) return res.status(403).json({ message: "Quiz is locked", locked: true });
    if (lessonState?.passed) {
      return res.status(409).json({ message: "Already passed", passed: true, locked: true });
    }

    const safe = {
      _id: quiz._id,
      title: quiz.title,
      type: quiz.type,
      courseId: quiz.courseId,
      lessonId: quiz.lessonId,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
      attemptsUsed,
      attemptsLeft,
    };
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const quizId = toObjectId(req.params.quizId);
    if (!quizId) return res.status(400).json({ message: "Invalid quiz id" });
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.type === "FINAL") return submitFinalQuiz(req, res, next);

    const userId = getUserId(req);
    const progress = await ensureEnrollmentProgress({ userId, courseId: quiz.courseId });
    let row = progress.lessonQuizProgress.find((x) => String(x.quizId) === String(quiz._id));
    if (!row) {
      row = {
        lessonId: quiz.lessonId,
        quizId: quiz._id,
        attempts: 0,
        bestScore: 0,
        passed: false,
        locked: false,
      };
      progress.lessonQuizProgress.push(row);
      row = progress.lessonQuizProgress[progress.lessonQuizProgress.length - 1];
    }

    if (row.locked) return res.status(403).json({ message: "Quiz locked", locked: true });
    if (row.passed) {
      return res.status(409).json({ message: "Already passed", passed: true, locked: true });
    }

    const score = scoreQuiz(quiz, req.body?.answers || {});
    row.attempts += 1;
    row.bestScore = Math.max(row.bestScore || 0, score);
    row.passed = score >= quiz.passingScore;
    if (row.passed) row.locked = true;
    if (!row.passed && row.attempts >= quiz.maxAttempts) row.locked = true;
    await progress.save();

    res.json({
      score,
      passed: row.passed,
      attemptsUsed: row.attempts,
      attemptsLeft: Math.max(quiz.maxAttempts - row.attempts, 0),
      locked: row.locked,
      bestScore: row.bestScore,
    });
  } catch (err) {
    next(err);
  }
};

export const startFinalQuiz = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id || req.body?.courseId);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const quiz = await Quiz.findOne({ courseId, type: "FINAL" });
    if (!quiz) return res.status(404).json({ message: "Final quiz not found" });
    if (!quiz.isFinalized) return res.status(400).json({ message: "Final quiz is not finalized" });

    const userId = getUserId(req);
    const { allLessonsDone, allLessonQuizzesPassed, progress } =
      await calculateLessonsCompletion({
        userId,
        user: req.user,
        courseId,
      });

    if (!allLessonsDone || !allLessonQuizzesPassed) {
      return res.status(403).json({
        message: "Final quiz is locked. Complete all lessons and pass all lesson quizzes.",
        finalQuizUnlocked: false,
      });
    }

    const finalState = progress.finalQuizProgress || {};
    if (finalState.locked) {
      return res.json({
        message: finalState.passed
          ? "Final quiz already passed and locked."
          : "Final quiz locked after max attempts.",
        locked: true,
        passed: !!finalState.passed,
        attemptsUsed: Number(finalState.attempts || 0),
        attemptsLeft: Math.max(4 - Number(finalState.attempts || 0), 0),
        bestScore: Number(finalState.bestScore || 0),
        canSelectTemplate:
          !!finalState.passed &&
          Number(finalState.attempts || 0) === 1 &&
          Number(finalState.bestScore || 0) >= 75,
      });
    }

    res.json({
      _id: quiz._id,
      title: quiz.title,
      type: quiz.type,
      courseId: quiz.courseId,
      passingScore: 75,
      maxAttempts: 4,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
      attemptsUsed: finalState.attempts || 0,
      attemptsLeft: Math.max(4 - Number(finalState.attempts || 0), 0),
      violations: finalState.violations || 0,
      finalQuizUnlocked: true,
    });
  } catch (err) {
    next(err);
  }
};

export const submitFinalQuiz = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id || req.body?.courseId);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const quiz = await Quiz.findOne({ courseId, type: "FINAL" });
    if (!quiz) return res.status(404).json({ message: "Final quiz not found" });

    const userId = getUserId(req);
    const progress = await ensureEnrollmentProgress({ userId, courseId });
    const finalState = progress.finalQuizProgress || {};

    if (finalState.locked) {
      return res.status(403).json({
        message: finalState.passed
          ? "You already passed final quiz. Retake is not allowed."
          : "Final quiz is locked permanently.",
        locked: true,
        passed: !!finalState.passed,
      });
    }

    const score = scoreQuiz(quiz, req.body?.answers || {});
    const attempts = Number(finalState.attempts || 0) + 1;
    const bestScore = Math.max(Number(finalState.bestScore || 0), score);
    const requiredScore = 75;
    const passed = score >= requiredScore;
    const locked = passed || attempts >= 4;
    const canSelectTemplate = passed && attempts === 1 && score >= requiredScore;

    progress.finalQuizProgress = {
      quizId: quiz._id,
      attempts,
      bestScore,
      passed,
      locked,
      violations: Number(finalState.violations || 0),
    };
    await progress.save();

    res.json({
      score,
      passed,
      locked,
      attemptsUsed: attempts,
      attemptsLeft: Math.max(4 - attempts, 0),
      bestScore,
      requiredScore,
      canSelectTemplate,
      next: canSelectTemplate ? "SELECT_CERTIFICATE_TEMPLATE" : "RETRY_OR_EXIT",
      message: canSelectTemplate
        ? "Passed in first attempt with >=75%. Select certificate template."
        : passed
          ? "Quiz passed, but template selection requires first attempt with >=75%."
          : "Final quiz failed. You can retry until attempts are exhausted.",
    });
  } catch (err) {
    next(err);
  }
};

export const registerFinalQuizViolation = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const quiz = await Quiz.findOne({ courseId, type: "FINAL" });
    if (!quiz) return res.status(404).json({ message: "Final quiz not found" });

    const userId = getUserId(req);
    const progress = await ensureEnrollmentProgress({ userId, courseId });
    const state = progress.finalQuizProgress || {};

    if (state.locked) {
      return res.status(403).json({ message: "Final quiz is locked", locked: true });
    }

    const violations = Number(state.violations || 0) + 1;
    let action = "WARNING_1";
    if (violations === 2) action = "WARNING_2";
    if (violations >= 3) action = "AUTO_FAIL";

    let updated = {
      quizId: quiz._id,
      attempts: Number(state.attempts || 0),
      bestScore: Number(state.bestScore || 0),
      passed: !!state.passed,
      locked: !!state.locked,
      violations,
    };

    if (action === "AUTO_FAIL") {
      updated.attempts += 1;
      if (updated.attempts >= 4) updated.locked = true;
    }

    progress.finalQuizProgress = updated;
    await progress.save();

    res.json({
      action,
      violations,
      attemptsUsed: updated.attempts,
      attemptsLeft: Math.max(4 - updated.attempts, 0),
      locked: updated.locked,
      message:
        action === "AUTO_FAIL"
          ? "3 violations reached. Attempt auto-submitted as failed."
          : action === "WARNING_2"
            ? "Second warning. Next violation will auto-fail."
            : "Warning: stay in fullscreen and active window.",
    });
  } catch (err) {
    next(err);
  }
};

export const selectCertificateTemplate = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    const templateId = toObjectId(req.body?.templateId);
    if (!courseId || !templateId) {
      return res.status(400).json({ message: "Valid courseId and templateId are required" });
    }

    const user = req.user;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.certificateEnabled) {
      return res.status(400).json({ message: "Certificate is disabled for this course" });
    }

    const progress = await ensureEnrollmentProgress({ userId: user._id, courseId });
    if (!progress.finalQuizProgress?.passed) {
      return res.status(403).json({ message: "Pass final quiz before selecting template" });
    }
    if (
      Number(progress.finalQuizProgress?.attempts || 0) !== 1 ||
      Number(progress.finalQuizProgress?.bestScore || 0) < 75
    ) {
      return res.status(403).json({
        message:
          "Template selection is allowed only if final quiz is passed in first attempt with >=75%.",
      });
    }

    const template = await CertificateTemplate.findOne({ _id: templateId, enabled: true });
    if (!template) return res.status(404).json({ message: "Template not found" });

    if (
      Array.isArray(course.allowedTemplateIds) &&
      course.allowedTemplateIds.length > 0 &&
      !course.allowedTemplateIds.some((id) => String(id) === String(templateId))
    ) {
      return res.status(403).json({ message: "Template is not allowed for this course" });
    }

    const cert = await issueCertificate({ user, course, template });

    progress.certificate = {
      issued: true,
      templateId: template._id,
      certNo: cert.certNo,
      pdfUrl: cert.pdfUrl || `${safeOrigin()}${cert.pdfPath}`,
      emailedAt: cert.emailedAt || null,
    };
    await progress.save();

    res.status(201).json({
      message: "Certificate request submitted. Please wait till admin approves your certificate.",
      certificate: {
        certNo: cert.certNo,
        pdfUrl: cert.pdfUrl || `${safeOrigin()}${cert.pdfPath}`,
        issuedAt: cert.issuedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailableCertificateTemplates = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(courseId).select("allowedTemplateIds");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const filter = { enabled: true };
    if (Array.isArray(course.allowedTemplateIds) && course.allowedTemplateIds.length > 0) {
      filter._id = { $in: course.allowedTemplateIds };
    }

    const templates = await CertificateTemplate.find(filter)
      .select("_id name key backgroundUrl")
      .sort({ createdAt: -1 })
      .lean();

    res.json(templates);
  } catch (err) {
    next(err);
  }
};

export const downloadCertificate = async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ message: "Invalid course id" });

    const cert = await Certificate.findOne({ userId: getUserId(req), courseId });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    if (!cert.published) {
      return res.status(403).json({
        message: "Wait until admin publishes your certificate.",
      });
    }

    res.json({
      certNo: cert.certNo,
      certificateId: cert.certificateId,
      pdfUrl: cert.pdfUrl || `${safeOrigin()}${cert.pdfPath}`,
      issuedAt: cert.issuedAt,
    });
  } catch (err) {
    next(err);
  }
};
