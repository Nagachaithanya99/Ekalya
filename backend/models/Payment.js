import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    amount: { type: Number, required: true }, // rupees
    currency: { type: String, default: "INR" },
    baseAmount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },

    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    signature: { type: String, required: true },

    status: { type: String, enum: ["paid"], default: "paid" },
  },
  { timestamps: true }
);

paymentSchema.index({ paymentId: 1 }, { unique: true });

export default mongoose.model("Payment", paymentSchema);
