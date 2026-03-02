import api from "./api";

/* ================= STUDENT (Manual Requests) ================= */

// ✅ Student creates manual payment request
// Backend is usually: POST /api/payment-requests (or similar)
// Keep these ONLY if your backend really has /payments endpoints for student.
// If your student route is different, we’ll adjust after you paste that route file.
export const createPaymentRequest = (data) => api.post("/payment-requests", data);

// ✅ Student gets their own requests
export const getMyPaymentRequests = () => api.get("/payment-requests/my");

/* ================= ADMIN (Manual Requests) ================= */

// ✅ List all payment requests (Admin)
export const adminGetPaymentRequests = () =>
  api.get("/admin/payments/requests");

// ✅ Approve request (Admin)
export const adminApprovePayment = (id) =>
  api.post(`/admin/payments/requests/${id}/approve`);

// ✅ Reject request (Admin)
export const adminRejectPayment = (id, note = "") =>
  api.post(`/admin/payments/requests/${id}/reject`, { note });
