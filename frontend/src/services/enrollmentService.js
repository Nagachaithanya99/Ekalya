import api from "./api";

// Student enrolls
export const enrollCourse = (courseId) =>
  api.post("/enrollments/enroll", { courseId });

// My courses
export const getMyCourses = () => api.get("/enrollments/my");

// ✅ Get resume time for a lesson
export const getLessonProgress = (courseId, lessonId) =>
  api.get(`/enrollments/lesson-progress/${courseId}/${lessonId}`);

// ✅ Save watching progress (timeupdate / ended)
export const saveLessonProgress = ({
  courseId,
  lessonId,
  watchedSeconds,
  durationSeconds,
  ended = false,
}) =>
  api.post("/enrollments/lesson-progress", {
    courseId,
    lessonId,
    watchedSeconds,
    durationSeconds,
    ended,
  });
