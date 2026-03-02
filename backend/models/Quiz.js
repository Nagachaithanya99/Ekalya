import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["LESSON", "FINAL"],
      default: "LESSON",
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    passingScore: { type: Number, default: 60, min: 1, max: 100 },
    timeLimitMinutes: { type: Number, default: 15, min: 1, max: 600 },
    maxAttempts: { type: Number, default: 3, min: 1, max: 20 },
    cooldownMinutes: { type: Number, default: 0, min: 0, max: 1440 },
    isFinalized: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

quizSchema.index({ courseId: 1, lessonId: 1 }, { unique: false });
quizSchema.index({ courseId: 1, type: 1 }, { unique: false });

export default mongoose.model("Quiz", quizSchema);
