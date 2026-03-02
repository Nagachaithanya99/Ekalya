import api from "./api";

export const getBlogs = () => api.get("/blogs");
export const submitContact = (data) =>
  api.post("/contact", data);
