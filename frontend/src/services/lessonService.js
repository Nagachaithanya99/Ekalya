import api from "./api";

// STUDENT
export const getLessonsByCourse = (courseId) =>
  api.get(`/lessons/course/${courseId}`);

// ADMIN — CREATE lesson (FormData)
export const createLesson = (formData) =>
  api.post("/lessons", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ADMIN — UPDATE lesson (FormData + correct route)
export const updateLesson = (id, formData) =>
  api.put(`/lessons/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ADMIN — DELETE lesson
export const deleteLesson = (id) =>
  api.delete(`/lessons/${id}`);