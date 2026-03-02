import api from "./api";

export const getMyNotifications = (params = {}) =>
  api.get("/notifications/my", { params });

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");
