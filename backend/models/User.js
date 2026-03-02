import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    email: { type: String, default: null, trim: true, lowercase: true },
    role: { type: String, enum: ["student", "admin"], default: "student" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
