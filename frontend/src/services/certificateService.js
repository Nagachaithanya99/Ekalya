import api from "./api";

/* STUDENT */
export const getMyCertificates = () => api.get("/certificates/my");
export const getMyAllCertificates = () => api.get("/certificates/mine");
export const getCertificateTemplates = () => api.get("/certificates/templates");
export const selectCertificateTemplate = (courseId, templateKey) =>
  api.post("/certificates/select-template", { courseId, templateKey });

/* ADMIN */
export const getAllCertificatesAdmin = () => api.get("/admin/certificates");
export const getCertificatesDirectoryAdmin = () =>
  api.get("/admin/certificates-directory");

export const publishCertificate = (id) =>
  api.patch(`/admin/certificates/${id}/publish`);

export const unpublishCertificate = (id) =>
  api.patch(`/admin/certificates/${id}/unpublish`);
