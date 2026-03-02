import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Certificate from "../models/Certificate.js";

/**
 * ADMIN — Dashboard stats
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      courses: await Course.countDocuments(),
      enrollments: await Enrollment.countDocuments(),
      certificates: await Certificate.countDocuments(),
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — Get all certificates
 * GET /api/admin/certificates/all  (or whatever route you attach)
 */
export const getAllCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find()
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN — Students progress list (basic)
 * GET /api/admin/students-progress
 */
export const getStudentsProgress = async (req, res, next) => {
  try {
    const data = await Enrollment.find()
      .populate("userId")
      .populate("courseId")
      .sort({ createdAt: -1 });

    const cleaned = data.map((e) => ({
      _id: e._id,
      studentName: e.userId?.name || e.userId?.email || "Student",
      studentEmail: e.userId?.email || "",
      courseTitle: e.courseId?.title || "Course",
      progressPercent: e.progressPercent || 0,
      completed: e.completed || false,
    }));

    res.json(cleaned);
  } catch (err) {
    next(err);
  }
};

/**
 * ADMIN - Students directory with profile drawer data
 * GET /api/admin/students-directory
 */
export const getStudentsDirectory = async (req, res, next) => {
  try {
    const students = await User.find({ role: "student" })
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);

    const enrollments = await Enrollment.find({ userId: { $in: studentIds } })
      .populate("courseId", "title category level")
      .select("userId courseId progressPercent completed createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const coursesByStudent = new Map();

    for (const e of enrollments) {
      const key = String(e.userId);
      if (!coursesByStudent.has(key)) coursesByStudent.set(key, []);

      coursesByStudent.get(key).push({
        enrollmentId: e._id,
        courseId: e.courseId?._id || null,
        courseTitle: e.courseId?.title || "Course",
        category: e.courseId?.category || "General",
        level: e.courseId?.level || "Beginner",
        progressPercent: Number(e.progressPercent || 0),
        completed: !!e.completed,
        enrolledAt: e.createdAt,
      });
    }

    const data = students.map((s) => {
      const courses = coursesByStudent.get(String(s._id)) || [];
      const completedCourses = courses.filter((c) => c.completed).length;

      return {
        _id: s._id,
        name: s.name || s.email || "Student",
        email: s.email || "",
        role: s.role,
        joinedAt: s.createdAt,
        totalCourses: courses.length,
        completedCourses,
        courses,
      };
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};
