import api from "./api";

export const adminCreateCourse = (data) => api.post("/admin/courses", data);
export const adminUpdateCourse = (id, data) => api.put(`/admin/courses/${id}`, data);
export const adminFinalizeLessons = (id) => api.post(`/admin/courses/${id}/finalize-lessons`);
export const adminAddLesson = (id, data) => api.post(`/admin/courses/${id}/add-lesson`, data);
export const adminFinalizeQuizzes = (id) => api.post(`/admin/courses/${id}/finalize-quizzes`);
export const adminPublishCourse = (id) => api.post(`/admin/courses/${id}/publish`);
export const adminUpdateAllowedTemplates = (id, allowedTemplateIds) =>
  api.put(`/admin/courses/${id}/allowed-templates`, { allowedTemplateIds });

export const adminListTemplates = () => api.get("/admin/templates");
export const adminCreateTemplate = (data) => api.post("/admin/templates", data);
export const adminUpdateTemplate = (id, data) => api.put(`/admin/templates/${id}`, data);
export const adminDeleteTemplate = (id) => api.delete(`/admin/templates/${id}`);

export const getPublishedCourses = () => api.get("/courses");
export const getPublishedCourseById = (id) => api.get(`/courses/${id}`);

export const enrollCourseFlow = (id) => api.post(`/student/courses/${id}/enroll`);
export const completeLessonFlow = (courseId, lessonId) =>
  api.post(`/student/courses/${courseId}/lessons/${lessonId}/complete`);

export const startLessonQuiz = (quizId) => api.post(`/student/quizzes/${quizId}/start`);
export const submitLessonQuiz = (quizId, answers) =>
  api.post(`/student/quizzes/${quizId}/submit`, { answers });

export const startFinalQuizFlow = (courseId) =>
  api.post(`/student/courses/${courseId}/final-quiz/start`);
export const submitFinalQuizFlow = (courseId, answers) =>
  api.post(`/student/courses/${courseId}/final-quiz/submit`, { answers });
export const reportFinalQuizViolation = (courseId, reason) =>
  api.post(`/student/courses/${courseId}/final-quiz/violation`, { reason });

export const selectCertificateTemplateFlow = (courseId, templateId) =>
  api.post(`/student/courses/${courseId}/certificate/select-template`, { templateId });
export const getCertificateTemplatesFlow = (courseId) =>
  api.get(`/student/courses/${courseId}/certificate/templates`);
export const downloadCertificateFlow = (courseId) =>
  api.get(`/student/courses/${courseId}/certificate/download`);
