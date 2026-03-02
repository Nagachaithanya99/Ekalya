// ✅ env already loaded by node --import ./config/env.js

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { clerkMiddleware, clerkClient } from "@clerk/express";

import User from "./models/User.js";

/* ===================== ROUTES ===================== */
import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import adminQuizRoutes from "./routes/adminQuizRoutes.js";
import adminCourseFlowRoutes from "./routes/adminCourseFlowRoutes.js";
import studentLearningRoutes from "./routes/studentLearningRoutes.js";

// ✅ Manual payment requests (student side)
import paymentRequestRoutes from "./routes/paymentRequestRoutes.js";

// ✅ Admin approve/reject manual payment requests
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";

// ✅ Razorpay student payments
import razorpayRoutes from "./routes/razorpayRoutes.js";

// ✅ Admin Razorpay enrollments + payments table
import adminPaymentsRoutes from "./routes/adminPaymentsRoutes.js";

/* ===================== ERROR HANDLER ===================== */
import errorHandler from "./middleware/errorHandler.js";

const app = express();

/* ===================== ESM __dirname ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===================== MIDDLEWARE ===================== */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin), false);
    },
    credentials: true,
  })
);

app.use(express.json());

/* ===================== STATIC FILES ===================== */
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

/* ===================== DB ===================== */
connectDB();

/* ===================== CLERK ===================== */
app.use(clerkMiddleware());

/**
 * ✅ Attach req.user from MongoDB
 */
app.use(async (req, res, next) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    if (!auth?.userId) return next();

    const clerkId = auth.userId;
    const cu = await clerkClient.users.getUser(clerkId);

    const email = (cu?.emailAddresses?.[0]?.emailAddress || "")
      .trim()
      .toLowerCase();

    const name = [cu?.firstName, cu?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const shouldBeAdmin = email && adminEmails.includes(email);

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({
        clerkId,
        email,
        name,
        role: shouldBeAdmin ? "admin" : "student",
      });
    } else {
      const updates = {};
      if (email && user.email !== email) updates.email = email;
      if (name && user.name !== name) updates.name = name;
      if (shouldBeAdmin && user.role !== "admin") updates.role = "admin";

      if (Object.keys(updates).length > 0) {
        user = await User.findOneAndUpdate(
          { clerkId },
          { $set: updates },
          { new: true }
        );
      }
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
});

/* ===================== ROUTES ===================== */
app.use("/api", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/admin/quizzes", adminQuizRoutes);
app.use("/api/admin", adminCourseFlowRoutes);
app.use("/api/student", studentLearningRoutes);

/* ======== PAYMENTS (SEPARATED) ======== */

// 🔹 Razorpay (student automatic payments)
app.use("/api/payments", razorpayRoutes);

// 🔹 Manual payment request (student uploads UTR/screenshot)
app.use("/api/payment-requests", paymentRequestRoutes);

// 🔹 Admin approve/reject manual payments
app.use("/api/admin/payments", adminPaymentRoutes);

// 🔹 Admin Razorpay payments table
app.use("/api/admin/payments-table", adminPaymentsRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Ekalya API running ✅" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy ✅" });
});

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ===================== ERROR HANDLER ===================== */
app.use(errorHandler);

/* ===================== START ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
