import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    videoUrl: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },

    order: { type: Number, default: 1 },
    isFreePreview: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lockedAtFinalize: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
