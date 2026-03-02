import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import PaymentRequest from "../models/PaymentRequest.js";

const BILL_TAX_PERCENT = Number(process.env.PAYMENT_TAX_PERCENT || 18);
const PLATFORM_FEE = Number(process.env.PAYMENT_PLATFORM_FEE || 0);

const computeBill = (coursePrice = 0) => {
  const baseAmount = Number(coursePrice || 0);
  const taxAmount = Number(((baseAmount * BILL_TAX_PERCENT) / 100).toFixed(2));
  const platformFee = Number(PLATFORM_FEE.toFixed(2));
  const totalAmount = Number((baseAmount + taxAmount + platformFee).toFixed(2));

  return {
    baseAmount,
    taxPercent: BILL_TAX_PERCENT,
    taxAmount,
    platformFee,
    totalAmount,
  };
};

export const getPaymentBill = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ message: "courseId required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.json({
      course: {
        _id: course._id,
        title: course.title,
        price: Number(course.price || 0),
      },
      bill: computeBill(course.price || 0),
    });
  } catch (err) {
    console.error("getPaymentBill error:", err);
    return res.status(500).json({ message: "Failed to load payment bill" });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const paid = await Payment.find({ userId: req.user._id })
      .populate("courseId", "title price")
      .sort({ createdAt: -1 })
      .lean();

    const manual = await PaymentRequest.find({ userId: req.user._id })
      .populate("courseId", "title price")
      .sort({ createdAt: -1 })
      .lean();

    const paidRows = paid.map((p) => ({
      _id: p._id,
      mode: "razorpay",
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      baseAmount: p.baseAmount,
      taxPercent: p.taxPercent,
      taxAmount: p.taxAmount,
      platformFee: p.platformFee,
      orderId: p.orderId,
      paymentId: p.paymentId,
      createdAt: p.createdAt,
      course: p.courseId
        ? { _id: p.courseId._id, title: p.courseId.title, price: p.courseId.price }
        : null,
    }));

    const manualRows = manual.map((m) => ({
      _id: m._id,
      mode: "manual",
      status: m.status,
      amount: m.amount,
      utr: m.utr,
      note: m.note,
      screenshotUrl: m.screenshotUrl,
      createdAt: m.createdAt,
      course: m.courseId
        ? { _id: m.courseId._id, title: m.courseId.title, price: m.courseId.price }
        : null,
    }));

    const all = [...paidRows, ...manualRows].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json(all);
  } catch (err) {
    console.error("getMyPayments error:", err);
    return res.status(500).json({ message: "Failed to load payment history" });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const already = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });
    if (already) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    const price = Number(course.price || 0);
    if (price <= 0) {
      return res.status(400).json({ message: "Course is free" });
    }

    const bill = computeBill(price);
    const amount = Math.round(bill.totalAmount * 100);

    const receipt = `rcpt_${String(courseId).slice(-6)}${String(
      req.user._id
    ).slice(-6)}${String(Date.now()).slice(-6)}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        courseId: String(courseId),
        userId: String(req.user._id),
        clerkId: String(req.user.clerkId),
        email: req.user.email || "",
        baseAmount: String(bill.baseAmount),
        taxPercent: String(bill.taxPercent),
        taxAmount: String(bill.taxAmount),
        platformFee: String(bill.platformFee),
        totalAmount: String(bill.totalAmount),
      },
    });

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      course: {
        id: course._id,
        title: course.title,
        price,
      },
      bill,
      user: {
        name: req.user.name || "",
        email: req.user.email || "",
      },
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    return res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      courseId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !courseId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const bill = computeBill(Number(course.price || 0));

    await Payment.updateOne(
      { paymentId: razorpay_payment_id },
      {
        $setOnInsert: {
          userId: req.user._id,
          courseId,
          provider: "razorpay",
          amount: bill.totalAmount,
          currency: "INR",
          baseAmount: bill.baseAmount,
          taxPercent: bill.taxPercent,
          taxAmount: bill.taxAmount,
          platformFee: bill.platformFee,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "paid",
        },
      },
      { upsert: true }
    );

    await Enrollment.updateOne(
      { userId: req.user._id, courseId },
      {
        $setOnInsert: {
          userId: req.user._id,
          courseId,
          progressPercent: 0,
          completed: false,
          completedLessonIds: [],
          lessonProgress: [],
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: "Payment verified, saved & enrolled",
      razorpay_payment_id,
      razorpay_order_id,
    });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};
