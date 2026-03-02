import mongoose from "mongoose";

const paymentRequestSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
    },

    // ✅ UTR is now OPTIONAL
    utr: {
      type: String,
      default: "", // not required anymore
      trim: true,
    },

    screenshotUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// prevent duplicate pending for same user+course
paymentRequestSchema.index({ userId: 1, courseId: 1, status: 1 });

export default mongoose.model("PaymentRequest", paymentRequestSchema);
