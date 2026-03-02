import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    watched: {
      type: Boolean,
      default: false,
    },

    watchedAt: Date,
  },
  { timestamps: true }
);

userProgressSchema.index(
  { userId: 1, courseId: 1, lessonId: 1 },
  { unique: true }
);

export default mongoose.model("UserProgress", userProgressSchema);
