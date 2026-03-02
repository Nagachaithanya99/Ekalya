import cloudinary from "../config/cloudinary.js";

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    const type = req.body?.type || "image";
    const fileBuffer = req.file.buffer;

    let folder = "learning-platform/images";
    let resourceType = "image";

    if (type === "video") {
      folder = "learning-platform/videos";
      resourceType = "video";
    } else if (type === "pdf") {
      folder = "learning-platform/pdfs";
      resourceType = "raw"; // ✅ PDFs use raw
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, uploaded) => {
          if (error) return reject(error);
          resolve(uploaded);
        }
      );

      stream.end(fileBuffer);
    });

    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err?.message || err);
    next(err);
  }
};
