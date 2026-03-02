import api from "./api";

export const createQuiz = (data) =>
  api.post("/admin/quizzes", data);

export const getQuizzesByCourse = (courseId) =>
  api.get(`/admin/quizzes/${courseId}`);

export const deleteQuiz = (id) =>
  api.delete(`/admin/quizzes/${id}`);

export const updateQuiz = (id, data) =>
  api.put(`/admin/quizzes/${id}`, data);

export const generateQuizQuestions = (data) =>
  api.post("/admin/quizzes/generate", data);
