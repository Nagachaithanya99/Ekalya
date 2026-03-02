import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },

    category: { type: String, default: "General" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    price: { type: Number, default: 0 },

    // ✅ Featured fields (near price/published)
    featured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 }, // optional: used to sort featured courses

    thumbnailUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },

    durationHours: { type: Number, default: 0 },
    language: { type: String, default: "English" },

    state: {
      type: String,
      enum: ["DRAFT", "FINALIZED", "PUBLISHED"],
      default: "DRAFT",
      index: true,
    },
    lessonsFinalized: { type: Boolean, default: false },
    quizzesFinalized: { type: Boolean, default: false },
    certificateEnabled: { type: Boolean, default: true },
    allowedTemplateIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CertificateTemplate" },
    ],
    finalQuizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    // Backward-compatible flag used by existing frontend/pages
    published: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseSchema.pre("save", function syncPublishedFromState(next) {
  this.published = this.state === "PUBLISHED";
  next();
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
