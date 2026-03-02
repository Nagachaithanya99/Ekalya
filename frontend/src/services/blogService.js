import api from "./api";

/* =======================
   PUBLIC
======================= */

// Get all published blogs
export const getBlogs = () => api.get("/blogs");

// Get single published blog
export const getBlogById = (id) => api.get(`/blogs/${id}`);

/* =======================
   ADMIN
======================= */

// Get all blogs (published + drafts)
export const getBlogsAdmin = () => api.get("/admin/blogs");

// Create blog (always draft)
export const createBlog = (data) => api.post("/admin/blogs", data);

// Update blog content
export const updateBlog = (id, data) =>
  api.put(`/admin/blogs/${id}`, data);

// Delete blog
export const deleteBlog = (id) =>
  api.delete(`/admin/blogs/${id}`);

// Publish blog
export const publishBlog = (id) =>
  api.patch(`/admin/blogs/${id}/publish`);

// Unpublish blog
export const unpublishBlog = (id) =>
  api.patch(`/admin/blogs/${id}/unpublish`);
