import mongoose from "mongoose";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import Quiz from "../models/Quiz.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      $or: [{ state: "PUBLISHED" }, { published: true }],
    }).sort({ featured: -1, featuredOrder: -1, createdAt: -1 });

    res.json(courses);
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!(course.state === "PUBLISHED" || course.published)) {
      return res.status(403).json({ message: "Course not published" });
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const getAllCoursesAdmin = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({
      featured: -1,
      featuredOrder: -1,
      createdAt: -1,
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle = "",
      description = "",
      category = "General",
      level = "Beginner",
      price = 0,
      thumbnail,
      thumbnailUrl,
      bannerUrl = "",
      durationHours = 0,
      language = "English",
      certificateEnabled = true,
    } = req.body || {};

    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const course = await Course.create({
      title: String(title).trim(),
      subtitle,
      description,
      category,
      level,
      price: Number(price || 0),
      thumbnailUrl: thumbnailUrl || thumbnail || "",
      bannerUrl,
      durationHours: Number(durationHours || 0),
      language,
      createdBy: req.user?._id,
      certificateEnabled: !!certificateEnabled,
      state: "DRAFT",
      published: false,
      lessonsFinalized: false,
      quizzesFinalized: false,
    });

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.state === "PUBLISHED") {
      return res
        .status(400)
        .json({ message: "Published course cannot be edited. Unpublish first." });
    }

    const data = { ...req.body };
    if (data.thumbnail && !data.thumbnailUrl) {
      data.thumbnailUrl = data.thumbnail;
      delete data.thumbnail;
    }

    const updated = await Course.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Course not found" });

    await Promise.all([
      Lesson.deleteMany({ courseId: id }),
      Quiz.deleteMany({ courseId: id }),
    ]);

    res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

export const publishCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.lessonsFinalized || !course.quizzesFinalized || !course.finalQuizId) {
      return res.status(400).json({
        message:
          "Finalize lessons and quizzes first, and ensure final quiz exists.",
      });
    }

    course.state = "PUBLISHED";
    course.published = true;
    await course.save();

    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const unpublishCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findByIdAndUpdate(
      id,
      {
        state: "FINALIZED",
        published: false,
        featured: false,
        featuredOrder: 0,
      },
      { new: true }
    );

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const featureCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featuredOrder = 0 } = req.body || {};
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!(course.state === "PUBLISHED" || course.published)) {
      return res
        .status(400)
        .json({ message: "Publish the course before featuring it" });
    }

    course.featured = true;
    course.featuredOrder = Number(featuredOrder) || 0;
    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const unfeatureCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid course id" });

    const updated = await Course.findByIdAndUpdate(
      id,
      { featured: false, featuredOrder: 0 },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Course not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};
