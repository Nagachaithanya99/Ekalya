import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { ensureCertificateForCompletion } from "./certificateController.js";

/**
 * STUDENT: POST /api/enrollments/enroll
 */
export const enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) return res.status(400).json({ message: "courseId required" });
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      return res.status(404).json({ message: "Course not available" });
    }

    const existing = await Enrollment.findOne({ userId: req.user._id, courseId });
    if (existing) return res.json(existing);

    const enroll = await Enrollment.create({
      userId: req.user._id,
      courseId,
      progressPercent: 0,
      completed: false,

      // ✅ new
      lessonProgress: [], // [{ lessonId, watchedSeconds, durationSeconds, completed, updatedAt }]
      completedLessonIds: [],
    });

    res.status(201).json(enroll);
  } catch (err) {
    if (err.code === 11000) {
      const already = await Enrollment.findOne({
        userId: req.user._id,
        courseId: req.body.courseId,
      });
      return res.json(already);
    }
    next(err);
  }
};

/**
 * STUDENT: GET /api/enrollments/my
 */
export const getMyCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate("courseId")
      .sort({ createdAt: -1 });

    const cleaned = enrollments
      .filter((e) => e.courseId)
      .map((e) => ({
        _id: e._id,
        course: e.courseId,
        progressPercent: e.progressPercent,
        completed: e.completed,
        completedLessonIds: e.completedLessonIds,
        lessonProgress: e.lessonProgress,
      }));

    res.json(cleaned);
  } catch (err) {
    next(err);
  }
};

/**
 * STUDENT: GET /api/enrollments/lesson-progress/:courseId/:lessonId
 * Returns resume time
 */
export const getLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const enr = await Enrollment.findOne({ userId: req.user._id, courseId });
    if (!enr) return res.status(404).json({ message: "Not enrolled" });

    const lp = enr.lessonProgress?.find((x) => String(x.lessonId) === String(lessonId));

    res.json(lp || { watchedSeconds: 0, durationSeconds: 0, completed: false });
  } catch (err) {
    next(err);
  }
};

/**
 * STUDENT: POST /api/enrollments/lesson-progress
 * body: { courseId, lessonId, watchedSeconds, durationSeconds, ended?: boolean }
 */
export const saveLessonProgress = async (req, res, next) => {
  try {
    const { courseId, lessonId, watchedSeconds, durationSeconds, ended } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: "courseId and lessonId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const enrollment = await Enrollment.findOne({ userId: req.user._id, courseId });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    if (String(lesson.courseId) !== String(courseId)) {
      return res.status(400).json({ message: "Lesson does not belong to course" });
    }

    const w = Math.max(0, Number(watchedSeconds || 0));
    const d = Math.max(0, Number(durationSeconds || 0));
    const pct = d > 0 ? w / d : 0;

    // ✅ completion rule: ended OR watched >= 90%
    const isCompleted = Boolean(ended) || pct >= 0.9;

    enrollment.lessonProgress = enrollment.lessonProgress || [];

    const idx = enrollment.lessonProgress.findIndex(
      (x) => String(x.lessonId) === String(lessonId)
    );

    if (idx === -1) {
      enrollment.lessonProgress.push({
        lessonId,
        watchedSeconds: w,
        durationSeconds: d,
        completed: isCompleted,
        updatedAt: new Date(),
      });
    } else {
      // keep max watchedSeconds so user doesn't lose progress
      enrollment.lessonProgress[idx].watchedSeconds = Math.max(
        enrollment.lessonProgress[idx].watchedSeconds || 0,
        w
      );
      enrollment.lessonProgress[idx].durationSeconds = Math.max(
        enrollment.lessonProgress[idx].durationSeconds || 0,
        d
      );
      enrollment.lessonProgress[idx].completed =
        enrollment.lessonProgress[idx].completed || isCompleted;
      enrollment.lessonProgress[idx].updatedAt = new Date();
    }

    // keep completedLessonIds in sync
    const doneIds = new Set((enrollment.completedLessonIds || []).map(String));
    if (isCompleted) doneIds.add(String(lessonId));
    enrollment.completedLessonIds = Array.from(doneIds);

    // compute course progress from completed lesson ids (source of truth)
    const totalLessons = await Lesson.countDocuments({ courseId, isActive: true });
    const doneLessons = new Set((enrollment.completedLessonIds || []).map(String)).size;

    const progressPercent =
      totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

    enrollment.progressPercent = Math.min(progressPercent, 100);
    enrollment.completed = enrollment.progressPercent === 100 && totalLessons > 0;

    await enrollment.save();

    // ✅ Create certificate when completed (NOT published)
    if (enrollment.completed) {
      // Certificate generation should never break lesson progress saving.
      try {
        await ensureCertificateForCompletion({ user: req.user, courseId });
      } catch (certErr) {
        console.error("ensureCertificateForCompletion failed:", certErr?.message || certErr);
      }
    }

    res.json({
      progressPercent: enrollment.progressPercent,
      completed: enrollment.completed,
      lessonCompleted: isCompleted,
      resumeAt:
        enrollment.lessonProgress.find((x) => String(x.lessonId) === String(lessonId))
          ?.watchedSeconds || 0,
    });
  } catch (err) {
    next(err);
  }
};
