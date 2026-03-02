import api from "./api";

/**
 * Upload any file (image/pdf/video) to backend -> Cloudinary
 * Backend: POST /api/upload
 *
 * @param {File} file
 * @param {"image"|"video"|"pdf"} type
 * @returns {Promise<{url: string}>} returns { url }
 */
export const uploadFile = async (file, type = "image") => {
  if (!file) throw new Error("No file selected");

  const allowed = ["image", "video", "pdf"];
  const safeType = allowed.includes(type) ? type : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", safeType);

  try {
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const url = res?.data?.url;
    if (!url) throw new Error("Upload succeeded but no URL returned");
    return { url };
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Upload failed. Please try again.";
    throw new Error(msg);
  }
};

/**
 * Upload with progress callback (0-100)
 * @param {File} file
 * @param {"image"|"video"|"pdf"} type
 * @param {(percent:number)=>void} onProgress
 * @returns {Promise<{url:string}>}
 */
export const uploadFileWithProgress = async (
  file,
  type = "image",
  onProgress
) => {
  if (!file) throw new Error("No file selected");

  const allowed = ["image", "video", "pdf"];
  const safeType = allowed.includes(type) ? type : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", safeType);

  try {
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!evt?.total) return;
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onProgress?.(percent);
      },
    });

    const url = res?.data?.url;
    if (!url) throw new Error("Upload succeeded but no URL returned");
    onProgress?.(100);
    return { url };
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Upload failed. Please try again.";
    throw new Error(msg);
  }
};

/**
 * Optional helper: upload and directly return string url
 * @param {File} file
 * @param {"image"|"video"|"pdf"} type
 * @returns {Promise<string>}
 */
export const uploadFileUrl = async (file, type = "image") => {
  const { url } = await uploadFile(file, type);
  return url;
};

/**
 * (Optional) small hook-style wrapper for consistency with your codebase
 */
export const useUploadService = () => {
  return { uploadFile, uploadFileUrl, uploadFileWithProgress };
};
