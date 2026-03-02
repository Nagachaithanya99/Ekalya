import api from "./api";

export const getQuiz = (params) =>
  api.get("/quizzes", { params });

export const submitQuiz = (data) =>
  api.post("/quizzes/submit", data);
