import mongoose from "mongoose";

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true },
    backgroundUrl: { type: String, default: "" },
    htmlTemplate: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("CertificateTemplate", certificateTemplateSchema);
