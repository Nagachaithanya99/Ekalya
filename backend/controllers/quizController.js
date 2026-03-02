import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Enrollment from "../models/Enrollment.js";

const toObjectId = (v) => {
  if (!v) return null;
  if (!mongoose.Types.ObjectId.isValid(v)) return null;
  return new mongoose.Types.ObjectId(v);
};

export const getQuiz = async (req, res) => {
  try {
    const lessonId = toObjectId(req.query.lessonId);
    const courseId = toObjectId(req.query.courseId);

    if (!lessonId && !courseId) {
      return res
        .status(400)
        .json({ message: "Valid courseId or lessonId required" });
    }

    let quiz = null;

    // ✅ strongest match (lesson quiz)
    if (courseId && lessonId) {
      quiz = await Quiz.findOne({ courseId, lessonId }).lean();
    }

    // ✅ fallback: lessonId only
    if (!quiz && lessonId) {
      quiz = await Quiz.findOne({ lessonId }).lean();
    }

    // ✅ fallback: course final quiz
    if (!quiz && courseId) {
      quiz = await Quiz.findOne({ courseId, lessonId: null }).lean();
    }

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const mongoUserId = req.user?._id;
    const clerkUserId =
      (typeof req.auth === "function" ? req.auth() : req.auth)?.userId;
    const userKey = mongoUserId || clerkUserId;

    const attempts = await QuizAttempt.countDocuments({
      userId: userKey,
      quizId: quiz._id,
    });

    const safeQuiz = {
      ...quiz,
      questions: (quiz.questions || []).map((q) => ({
        question: q.question,
        options: q.options,
      })),
    };

    const maxAttempts = quiz.maxAttempts ?? 3;

    return res.json({
      ...safeQuiz,
      maxAttempts,
      attemptsUsed: attempts,
      attemptsLeft: Math.max(maxAttempts - attempts, 0),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load quiz",
      error: err?.message,
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    if (!quizId) return res.status(400).json({ message: "quizId is required" });

    const mongoUserId = req.user?._id;
    const clerkUserId =
      (typeof req.auth === "function" ? req.auth() : req.auth)?.userId;
    const attemptUserKey = mongoUserId || clerkUserId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const maxAttempts = quiz.maxAttempts ?? 3;

    const previousPassedAttempt = await QuizAttempt.findOne({
      userId: attemptUserKey,
      quizId,
      passed: true,
    }).lean();

    if (previousPassedAttempt) {
      return res.json({
        message: "You had already attempted successfully before.",
        alreadyPassed: true,
        passed: true,
      });
    }

    const attempts = await QuizAttempt.countDocuments({
      userId: attemptUserKey,
      quizId,
    });

    if (attempts >= maxAttempts) {
      return res.status(403).json({
        message: "Maximum attempts exceeded",
        attemptsLeft: 0,
      });
    }

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const ans = Array.isArray(answers) ? answers[i] : answers?.[i];
      if (Number(ans) === Number(q.correctAnswer)) correct++;
    });

    const total = quiz.questions.length || 1;
    const score = Math.round((correct / total) * 100);
    const passed = score >= (quiz.passingScore ?? 60);

    await QuizAttempt.create({
      userId: attemptUserKey,
      quizId,
      score,
      passed,
    });

    // ✅ Unlock lesson completion ONLY if passed and lesson quiz AND we have mongo userId
    if (passed && quiz.lessonId && mongoUserId) {
      await Enrollment.findOneAndUpdate(
        { userId: mongoUserId, courseId: quiz.courseId },
        { $addToSet: { completedLessonIds: quiz.lessonId } },
        { new: true }
      );
    }

    return res.json({
      score,
      passed,
      attemptsLeft: maxAttempts - (attempts + 1),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to submit quiz",
      error: err?.message,
    });
  }
};
