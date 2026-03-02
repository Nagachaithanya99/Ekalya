import api from "./api";

/* ================= PUBLIC ================= */

// Public: list published courses
export const getAllCourses = () => api.get("/courses");

// Optional alias (safe)
export const getPublicCourses = () => api.get("/courses");

// Public: single course
export const getCourseById = (id) => api.get(`/courses/${id}`);

/* ================= ADMIN ================= */

export const getAllCoursesAdmin = () => api.get("/admin/courses");

export const createCourse = (data) => api.post("/admin/courses", data);

export const updateCourse = (id, data) => api.put(`/admin/courses/${id}`, data);

export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`);

export const publishCourse = (id) => api.patch(`/admin/courses/${id}/publish`);

export const unpublishCourse = (id) =>
  api.patch(`/admin/courses/${id}/unpublish`);

/* ================= FEATURED (ADMIN) ================= */

// ⭐ Feature course on Home (admin only)
export const featureCourse = (id, featuredOrder = 0) =>
  api.patch(`/admin/courses/${id}/feature`, { featuredOrder });

// ❌ Remove from Home featured (admin only)
export const unfeatureCourse = (id) =>
  api.patch(`/admin/courses/${id}/unfeature`);
