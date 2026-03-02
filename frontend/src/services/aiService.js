import api from "./api";

export const sendAiMessage = (message, courseId = null, lessonId = null) => {
  return api.post("/ai/chat", { message, courseId, lessonId });
};
