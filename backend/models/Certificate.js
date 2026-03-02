import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
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
    certificateId: { type: String, required: true, unique: true },
    certNo: { type: String, required: true, unique: true },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
      default: null,
    },
    templateKey: { type: String, default: "classic-blue" },
    pdfPath: { type: String, required: true },
    pdfUrl: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now },
    emailedAt: { type: Date, default: null },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
