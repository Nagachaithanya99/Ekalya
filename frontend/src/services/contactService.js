import  api  from "./api";

/* Public */
export const sendContactMessage = (data) => api.post("/contact", data);

/* Admin */
export const getAllMessages = () => api.get("/admin/messages");
export const markMessageRead = (id) => api.patch(`/admin/messages/${id}/read`);
export const deleteMessage = (id) => api.delete(`/admin/messages/${id}`);
