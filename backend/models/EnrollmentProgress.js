import mongoose from "mongoose";

const lessonQuizProgressSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    attempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const finalQuizProgressSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    attempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    violations: { type: Number, default: 0 },
  },
  { _id: false }
);

const certificateStateSchema = new mongoose.Schema(
  {
    issued: { type: Boolean, default: false },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
      default: null,
    },
    certNo: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    emailedAt: { type: Date, default: null },
  },
  { _id: false }
);

const enrollmentProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completedLessons: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Lesson",
      default: [],
    },
    lessonQuizProgress: { type: [lessonQuizProgressSchema], default: [] },
    finalQuizProgress: { type: finalQuizProgressSchema, default: () => ({}) },
    certificate: { type: certificateStateSchema, default: () => ({}) },
  },
  { timestamps: true }
);

enrollmentProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("EnrollmentProgress", enrollmentProgressSchema);
