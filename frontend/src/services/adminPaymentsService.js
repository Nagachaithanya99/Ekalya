import api from "./api";

export const adminEnrollmentPaymentsTable = () => {
  return api.get("/admin/payments-table/enrollments-table");
};
