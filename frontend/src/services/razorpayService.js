import api from "./api";

/**
 * POST /api/payments/razorpay/order
 * body: { courseId }
 */
export const createRazorpayOrder = (courseId) => {
  return api.post("/payments/razorpay/order", { courseId });
};

export const getPaymentBill = (courseId) => {
  return api.get(`/payments/bill/${courseId}`);
};

export const getMyPaymentHistory = () => {
  return api.get("/payments/my");
};

/**
 * POST /api/payments/razorpay/verify
 * body:
 * {
 *   courseId,
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature
 * }
 */
export const verifyRazorpayPayment = (payload) => {
  return api.post("/payments/razorpay/verify", payload);
};
