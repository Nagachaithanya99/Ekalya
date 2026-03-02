import mongoose from "mongoose";
import streamifier from "streamifier";

import Lesson from "../models/Lesson.js";
import Course from "../models/Course.js";
import cloudinary from "../config/cloudinary.js";

/**
 * PUBLIC / STUDENT
 * GET /api/lessons/course/:courseId
 */
export const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.published && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Course not published" });
    }

    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    next(err);
  }
};

/* ---------------- Cloudinary helper ---------------- */

const uploadVideoBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_large_stream?.(
        {
          resource_type: "video",
          folder: "lms/videos",
          chunk_size: 6_000_000,
          timeout: 120000,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ) ||
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "lms/videos",
          timeout: 120000,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * ADMIN
 * POST /api/lessons
 * multipart/form-data (video file OR videoUrl)
 */
export const createLesson = async (req, res, next) => {
  try {
    const {
      courseId,
      title,
      description,
      videoUrl,
      pdfUrl,
      order,
      isFreePreview,
    } = req.body;

    if (!courseId) return res.status(400).json({ message: "courseId required" });
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    if (!title?.trim())
      return res.status(400).json({ message: "title required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.state === "PUBLISHED") {
      return res.status(400).json({ message: "Unpublish course before adding lessons" });
    }

    let finalVideoUrl = (videoUrl || "").trim();

    if (req.file?.buffer) {
      try {
        const uploaded = await uploadVideoBufferToCloudinary(req.file.buffer);
        finalVideoUrl = uploaded.secure_url;
      } catch (cloudErr) {
        console.error("🔥 Cloudinary upload error:", cloudErr);
        return res.status(502).json({
          message:
            cloudErr?.message ||
            "Video upload failed (Cloudinary timeout). Try smaller file.",
        });
      }
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ message: "Provide video file or videoUrl" });
    }

    let nextOrder = Number(order ?? 1);
    if (course.lessonsFinalized) {
      const last = await Lesson.findOne({ courseId }).sort({ order: -1 }).lean();
      nextOrder = Math.max(nextOrder, Number(last?.order || 0) + 1);
    }

    const lesson = await Lesson.create({
      courseId,
      title: title.trim(),
      description: description || "",
      videoUrl: finalVideoUrl,
      pdfUrl: (pdfUrl || "").trim(),
      order: nextOrder,
      isFreePreview: String(isFreePreview) === "true" || isFreePreview === true,
      isActive: true,
      lockedAtFinalize: false,
    });

    if (course.lessonsFinalized) {
      const Quiz = (await import("../models/Quiz.js")).default;
      await Quiz.findOneAndUpdate(
        { courseId, lessonId: lesson._id, type: "LESSON" },
        {
          $setOnInsert: {
            title: `${lesson.title} Quiz`,
            type: "LESSON",
            courseId,
            lessonId: lesson._id,
            passingScore: 60,
            maxAttempts: 3,
            questions: [],
            isFinalized: false,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN
 * PUT /api/lessons/:id
 * multipart/form-data (optional video file OR videoUrl)
 */
export const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const course = await Course.findById(lesson.courseId);
    if (course?.state === "PUBLISHED") {
      return res.status(400).json({ message: "Unpublish course before editing lessons" });
    }

    const {
      title,
      description,
      videoUrl,
      pdfUrl,
      order,
      isFreePreview,
      courseId,
    } = req.body;

    // ✅ Update course if provided
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });
      lesson.courseId = courseId;
    }

    if (title !== undefined) lesson.title = String(title).trim();
    if (description !== undefined) lesson.description = description || "";
    if (pdfUrl !== undefined) lesson.pdfUrl = String(pdfUrl || "").trim();
    if (order !== undefined) {
      if (course?.lessonsFinalized && lesson.lockedAtFinalize) {
        return res.status(400).json({
          message: "Old lesson order is locked after finalize. Add new lessons only.",
        });
      }
      lesson.order = Number(order ?? 1);
    }

    if (isFreePreview !== undefined) {
      lesson.isFreePreview =
        String(isFreePreview) === "true" || isFreePreview === true;
    }

    // 🎥 VIDEO UPDATE (file has priority over URL)
    let finalVideoUrl = (videoUrl || "").trim();

    if (req.file?.buffer) {
      try {
        const uploaded = await uploadVideoBufferToCloudinary(req.file.buffer);
        finalVideoUrl = uploaded.secure_url;
      } catch (cloudErr) {
        console.error("🔥 Cloudinary upload error:", cloudErr);
        return res.status(502).json({
          message:
            cloudErr?.message ||
            "Video upload failed (Cloudinary timeout). Try smaller file.",
        });
      }
    }

    if (finalVideoUrl) lesson.videoUrl = finalVideoUrl;

    if (!lesson.title?.trim()) {
      return res.status(400).json({ message: "title required" });
    }

    await lesson.save();
    res.json(lesson);
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN
 * DELETE /api/lessons/:id
 */
export const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const course = await Course.findById(lesson.courseId);
    if (course?.lessonsFinalized && lesson.lockedAtFinalize) {
      return res.status(400).json({
        message: "Cannot delete lessons that existed before lesson finalization",
      });
    }

    await Lesson.findByIdAndDelete(id);

    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    next(err);
  }
};
