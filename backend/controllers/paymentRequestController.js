import PaymentRequest from "../models/PaymentRequest.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import { notifyAdmins, notifyUser } from "../services/notificationService.js";

const safeNotify = async (promise) => {
  try {
    await promise;
  } catch (err) {
    console.error("Notification error:", err?.message || err);
  }
};

/**
 * STUDENT: POST /api/payment-requests
 * body: { courseId, amount, utr(optional), screenshotUrl, note(optional) }
 */
export const createPaymentRequest = async (req, res) => {
  try {
    const { courseId, amount, utr, screenshotUrl, note } = req.body;

    if (!courseId) return res.status(400).json({ message: "courseId required" });
    if (amount === undefined || amount === null || amount === "")
      return res.status(400).json({ message: "amount required" });

    if (!screenshotUrl)
      return res.status(400).json({ message: "screenshotUrl required" });

    // prevent duplicates if already enrolled
    const already = await Enrollment.findOne({ userId: req.user._id, courseId });
    if (already) return res.status(400).json({ message: "Already enrolled" });

    // prevent multiple pending requests for same course+user
    const pending = await PaymentRequest.findOne({
      userId: req.user._id,
      courseId,
      status: "pending",
    });
    if (pending)
      return res.status(400).json({ message: "Payment request already pending" });

    const cleanUTR = String(utr || "").trim(); // ✅ optional now
    const cleanNote = String(note || "").trim();

    const doc = await PaymentRequest.create({
      userId: req.user._id,
      courseId,
      amount: Number(amount),
      utr: cleanUTR, // ✅ can be ""
      screenshotUrl: String(screenshotUrl).trim(),
      status: "pending",
      note: cleanNote, // ✅ student can send note (admin can overwrite on reject)
    });

    const course = await Course.findById(courseId).select("title");
    safeNotify(
      notifyAdmins({
        type: "payment",
        title: "New Payment Request",
        message: `${req.user?.name || req.user?.email || "Student"} requested payment approval for "${course?.title || "course"}".`,
        link: "/admin/payments",
        meta: { paymentRequestId: String(doc._id), courseId: String(courseId) },
        createdBy: req.user?._id || null,
      })
    );

    return res.json(doc);
  } catch (err) {
    console.error("createPaymentRequest error:", err);
    return res.status(500).json({ message: "Failed to create payment request" });
  }
};

/**
 * STUDENT: GET /api/payment-requests/my
 */
export const myPaymentRequests = async (req, res) => {
  try {
    const list = await PaymentRequest.find({ userId: req.user._id })
      .populate("courseId", "title price")
      .sort({ createdAt: -1 });

    return res.json(list);
  } catch (err) {
    console.error("myPaymentRequests error:", err);
    return res.status(500).json({ message: "Failed to load requests" });
  }
};

/**
 * ADMIN: GET /api/admin/payments/requests
 */
export const adminListPaymentRequests = async (req, res) => {
  try {
    const list = await PaymentRequest.find()
      .populate("userId", "name email clerkId role")
      .populate("courseId", "title price")
      .sort({ createdAt: -1 });

    return res.json(list);
  } catch (err) {
    console.error("adminListPaymentRequests error:", err);
    return res.status(500).json({ message: "Failed to load payment requests" });
  }
};

/**
 * ADMIN: POST /api/admin/payments/requests/:id/approve
 */
export const adminApprovePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const pr = await PaymentRequest.findById(id);
    if (!pr) return res.status(404).json({ message: "Payment request not found" });

    if (pr.status !== "pending") {
      return res.status(400).json({ message: `Request already ${pr.status}` });
    }

    // enroll (duplicate-safe)
    await Enrollment.updateOne(
      { userId: pr.userId, courseId: pr.courseId },
      {
        $setOnInsert: {
          userId: pr.userId,
          courseId: pr.courseId,
          progressPercent: 0,
          completed: false,
          completedLessonIds: [],
          lessonProgress: [],
        },
      },
      { upsert: true }
    );

    pr.status = "approved";
    // keep any student note; don't wipe it
    await pr.save();

    const course = await Course.findById(pr.courseId).select("title");
    safeNotify(
      notifyUser(pr.userId, {
        type: "payment",
        title: "Payment Approved",
        message: `Your payment request for "${course?.title || "course"}" has been approved.`,
        link: "/student/payments",
        meta: { paymentRequestId: String(pr._id), courseId: String(pr.courseId) },
      })
    );

    return res.json({ success: true, message: "Approved & enrolled" });
  } catch (err) {
    console.error("adminApprovePaymentRequest error:", err);
    return res.status(500).json({ message: "Failed to approve request" });
  }
};

/**
 * ADMIN: POST /api/admin/payments/requests/:id/reject
 * body: { note }
 */
export const adminRejectPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};

    const pr = await PaymentRequest.findById(id);
    if (!pr) return res.status(404).json({ message: "Payment request not found" });

    if (pr.status !== "pending") {
      return res.status(400).json({ message: `Request already ${pr.status}` });
    }

    pr.status = "rejected";
    pr.note = String(note || "").trim();
    await pr.save();

    const course = await Course.findById(pr.courseId).select("title");
    safeNotify(
      notifyUser(pr.userId, {
        type: "payment",
        title: "Payment Rejected",
        message: `Your payment request for "${course?.title || "course"}" was rejected.${pr.note ? ` Reason: ${pr.note}` : ""}`,
        link: "/student/payments",
        meta: { paymentRequestId: String(pr._id), courseId: String(pr.courseId) },
      })
    );

    return res.json({ success: true, message: "Rejected" });
  } catch (err) {
    console.error("adminRejectPaymentRequest error:", err);
    return res.status(500).json({ message: "Failed to reject request" });
  }
};
