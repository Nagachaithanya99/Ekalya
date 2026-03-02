import api from "./api";

// Courses
export const getAllCourses = () => api.get("/courses");
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const addCourse = (formData) => api.post("/courses", formData);
export const updateCourse = (id, formData) => api.put(`/courses/${id}`, formData);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// Blogs
export const getAllBlogs = () => api.get("/blogs");
export const deleteBlog = (id) => api.delete(`/blogs/${id}`);

// Messages
export const getAllMessages = () => api.get("/contacts");
export const updateMessageStatus = (id, status) => api.put(`/contacts/${id}/status`, { status });
export const deleteMessage = (id) => api.delete(`/contacts/${id}`);

// ✅ USERS
export const getAllUsers = () => api.get("/users"); // <-- add this
