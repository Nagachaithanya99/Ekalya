import mongoose from "mongoose";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Quiz from "../models/Quiz.js";
import CertificateTemplate from "../models/CertificateTemplate.js";

const toObjectId = (v) =>
  mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : null;

const ensureCourse = async (courseId) => {
  const id = toObjectId(courseId);
  if (!id) return null;
  return Course.findById(id);
};

const ensureLessonQuizShell = async ({ courseId, lesson }) => {
  const existing = await Quiz.findOne({
    courseId,
    lessonId: lesson._id,
    type: "LESSON",
  });
  if (existing) return existing;

  return Quiz.create({
    title: `${lesson.title} Quiz`,
    type: "LESSON",
    courseId,
    lessonId: lesson._id,
    passingScore: 60,
    maxAttempts: 3,
    questions: [],
    isFinalized: false,
  });
};

const ensureFinalQuizShell = async ({ courseId }) => {
  const existing =
    (await Quiz.findOne({ courseId, type: "FINAL" })) ||
    (await Quiz.findOne({ courseId, type: "LESSON", lessonId: null }));
  if (existing) {
    if (existing.type !== "FINAL") {
      existing.type = "FINAL";
      existing.maxAttempts = 4;
      await existing.save();
    }
    return existing;
  }

  return Quiz.create({
    title: "Final Course Quiz",
    type: "FINAL",
    courseId,
    lessonId: null,
    passingScore: 60,
    maxAttempts: 4,
    questions: [],
    isFinalized: false,
  });
};

export const finalizeLessons = async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.state === "PUBLISHED") {
      return res.status(400).json({ message: "Cannot finalize lessons for published course" });
    }

    const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });
    if (!lessons.length) {
      return res.status(400).json({ message: "Add at least one lesson before finalizing" });
    }

    await Promise.all(
      lessons.map(async (lesson) => {
        if (!lesson.lockedAtFinalize) {
          lesson.lockedAtFinalize = true;
          await lesson.save();
        }
        await ensureLessonQuizShell({ courseId: course._id, lesson });
      })
    );

    const finalQuiz = await ensureFinalQuizShell({ courseId: course._id });
    course.lessonsFinalized = true;
    if (course.state === "DRAFT") course.state = "FINALIZED";
    if (!course.finalQuizId) course.finalQuizId = finalQuiz._id;
    await course.save();

    res.json({
      message: "Lessons finalized. Quiz shells generated.",
      lessonsFinalized: course.lessonsFinalized,
      finalQuizId: course.finalQuizId,
    });
  } catch (err) {
    next(err);
  }
};

export const addLessonAfterFinalize = async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.state === "PUBLISHED") {
      return res.status(400).json({ message: "Unpublish course before adding lessons" });
    }

    const { title, content = "", order, videoUrl = "", pdfUrl = "", isActive = true } = req.body || {};
    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "Lesson title is required" });
    }

    let nextOrder = Number(order || 0);
    if (!nextOrder) {
      const last = await Lesson.findOne({ courseId: course._id }).sort({ order: -1 });
      nextOrder = Number(last?.order || 0) + 1;
    }

    const lesson = await Lesson.create({
      courseId: course._id,
      title: String(title).trim(),
      description: String(content || ""),
      order: nextOrder,
      videoUrl,
      pdfUrl,
      isActive: !!isActive,
      lockedAtFinalize: false,
    });

    let quizShell = null;
    if (course.lessonsFinalized) {
      quizShell = await ensureLessonQuizShell({ courseId: course._id, lesson });
    }

    res.status(201).json({
      message: "Lesson added",
      lesson,
      quizShellCreated: !!quizShell,
      quizShell,
    });
  } catch (err) {
    next(err);
  }
};

export const finalizeQuizzes = async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.lessonsFinalized) {
      return res.status(400).json({ message: "Finalize lessons first" });
    }
    if (course.state === "PUBLISHED") {
      return res.status(400).json({ message: "Cannot finalize quizzes for published course" });
    }

    const lessons = await Lesson.find({ courseId: course._id, isActive: true });
    const lessonIds = lessons.map((l) => l._id);
    const quizzes = await Quiz.find({
      courseId: course._id,
      $or: [
        { type: "FINAL" },
        { type: "LESSON", lessonId: { $in: lessonIds } },
        { type: "LESSON", lessonId: null }, // backward-compat for old "final" quizzes
      ],
    });

    const finalQuiz =
      quizzes.find((q) => q.type === "FINAL") ||
      quizzes.find((q) => q.type === "LESSON" && !q.lessonId);
    if (!finalQuiz) return res.status(400).json({ message: "Final quiz not found" });
    if (!finalQuiz.questions.length) {
      return res.status(400).json({ message: "Final quiz must have at least one question" });
    }

    // Normalize old data so final quiz is stored consistently.
    if (finalQuiz.type !== "FINAL") {
      finalQuiz.type = "FINAL";
      finalQuiz.maxAttempts = 4;
      await finalQuiz.save();
    }

    const lessonQuizByLesson = new Map();
    quizzes
      .filter((q) => q.type === "LESSON" && q.lessonId)
      .forEach((q) => lessonQuizByLesson.set(String(q.lessonId), q));

    const lessonQuizIdsToFinalize = [];
    const skippedLessons = [];
    for (const lesson of lessons) {
      const quiz = lessonQuizByLesson.get(String(lesson._id));
      if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        skippedLessons.push(lesson.title);
        continue;
      }
      lessonQuizIdsToFinalize.push(quiz._id);
    }

    await Quiz.updateMany(
      { _id: { $in: [finalQuiz._id, ...lessonQuizIdsToFinalize] } },
      { $set: { isFinalized: true } }
    );
    course.quizzesFinalized = true;
    if (!course.finalQuizId) course.finalQuizId = finalQuiz._id;
    await course.save();

    res.json({
      message: "Quizzes finalized",
      quizzesFinalized: true,
      finalQuizId: String(course.finalQuizId),
      lessonQuizzesFinalized: lessonQuizIdsToFinalize.length,
      skippedLessons,
    });
  } catch (err) {
    next(err);
  }
};

export const publishCourseFlow = async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.lessonsFinalized || !course.quizzesFinalized || !course.finalQuizId) {
      return res.status(400).json({
        message:
          "Cannot publish. Ensure lessons finalized, quizzes finalized, and final quiz exists.",
      });
    }

    const finalQuiz = await Quiz.findById(course.finalQuizId);
    if (!finalQuiz || finalQuiz.type !== "FINAL" || !finalQuiz.isFinalized) {
      return res.status(400).json({ message: "Final quiz must exist and be finalized" });
    }

    course.state = "PUBLISHED";
    course.published = true;
    await course.save();
    res.json({ message: "Course published", course });
  } catch (err) {
    next(err);
  }
};

export const updateAllowedTemplates = async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const ids = Array.isArray(req.body?.allowedTemplateIds)
      ? req.body.allowedTemplateIds.filter((x) => toObjectId(x))
      : [];

    const templates = await CertificateTemplate.find({
      _id: { $in: ids },
      enabled: true,
    }).select("_id");

    course.allowedTemplateIds = templates.map((t) => t._id);
    await course.save();
    res.json({ message: "Allowed templates updated", allowedTemplateIds: course.allowedTemplateIds });
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, key, backgroundUrl = "", htmlTemplate, enabled = true } = req.body || {};
    if (!name || !key || !htmlTemplate) {
      return res.status(400).json({ message: "name, key and htmlTemplate are required" });
    }
    const doc = await CertificateTemplate.create({
      name: String(name).trim(),
      key: String(key).trim(),
      backgroundUrl: String(backgroundUrl || ""),
      htmlTemplate: String(htmlTemplate),
      enabled: !!enabled,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const listTemplates = async (req, res, next) => {
  try {
    const docs = await CertificateTemplate.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid template id" });

    const doc = await CertificateTemplate.findByIdAndUpdate(id, req.body || {}, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Template not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid template id" });

    const doc = await CertificateTemplate.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err) {
    next(err);
  }
};
