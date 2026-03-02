import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import generateCertificate from "../utils/generateCertificate.js";
import { sendEmail } from "../utils/sendEmail.js";

const TEMPLATE_OPTIONS = [
  {
    key: "classic-blue",
    name: "Classic Blue",
    description: "Clean white layout with blue achievement style",
  },
  {
    key: "academy",
    name: "Academy",
    description: "Modern academy look with bold heading",
  },
  {
    key: "ribbon",
    name: "Ribbon",
    description: "Certificate with angled ribbon accents",
  },
];

const safeOrigin = () => {
  const backendUrl = String(process.env.BACKEND_URL || "").trim();
  if (backendUrl) return backendUrl.replace(/\/$/, "");
  return `http://localhost:${process.env.PORT || 5000}`;
};

const formatIssuedOn = (date = new Date()) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const buildVerifyUrl = (certificateId) =>
  `${safeOrigin()}/certificates/${certificateId}.pdf`;

const mapStudentCert = (c) => ({
  _id: c._id,
  certificateId: c.certificateId,
  pdfPath: c.pdfPath,
  issuedAt: c.issuedAt,
  templateKey: c.templateKey || "classic-blue",
  published: !!c.published,
  course: c.courseId,
});

export const getCertificateTemplates = async (req, res) => {
  return res.json(TEMPLATE_OPTIONS);
};

export const getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({
      userId: req.user._id,
      published: true,
    })
      .populate("courseId")
      .sort({ createdAt: -1 });

    res.json(certs.map(mapStudentCert));
  } catch (err) {
    next(err);
  }
};

// Include unpublished too (for template selection flow)
export const getMyAllCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id })
      .populate("courseId")
      .sort({ createdAt: -1 });
    res.json(certs.map(mapStudentCert));
  } catch (err) {
    next(err);
  }
};

export const getAllCertificatesAdmin = async (req, res, next) => {
  try {
    const certs = await Certificate.find()
      .populate("userId")
      .populate("courseId")
      .sort({ createdAt: -1 });

    res.json(
      certs.map((c) => ({
        _id: c._id,
        certificateId: c.certificateId,
        pdfPath: c.pdfPath,
        issuedAt: c.issuedAt,
        published: c.published,
        publishedAt: c.publishedAt,
        templateKey: c.templateKey || "classic-blue",
        user: c.userId,
        course: c.courseId,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const getCertificatesDirectoryAdmin = async (req, res, next) => {
  try {
    const certs = await Certificate.find()
      .populate("userId", "name email")
      .populate("courseId", "title category level")
      .sort({ createdAt: -1 })
      .lean();

    const map = new Map();
    for (const c of certs) {
      const userId = c.userId?._id ? String(c.userId._id) : "";
      if (!userId) continue;

      if (!map.has(userId)) {
        map.set(userId, {
          _id: userId,
          name: c.userId?.name || c.userId?.email || "Student",
          email: c.userId?.email || "",
          totalCertificates: 0,
          publishedCertificates: 0,
          certificates: [],
        });
      }

      const row = map.get(userId);
      row.totalCertificates += 1;
      if (c.published) row.publishedCertificates += 1;
      row.certificates.push({
        _id: c._id,
        certificateId: c.certificateId,
        published: !!c.published,
        publishedAt: c.publishedAt || null,
        issuedAt: c.issuedAt || null,
        pdfPath: c.pdfPath || "",
        templateKey: c.templateKey || "classic-blue",
        course: {
          _id: c.courseId?._id || null,
          title: c.courseId?.title || "Course",
          category: c.courseId?.category || "General",
          level: c.courseId?.level || "Beginner",
        },
      });
    }

    return res.json(Array.from(map.values()));
  } catch (err) {
    next(err);
  }
};

export const publishCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid certificate id" });
    }

    const cert = await Certificate.findById(id)
      .populate("userId", "name email")
      .populate("courseId", "title");
    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    cert.published = true;
    cert.publishedAt = new Date();

    let emailSent = false;
    const to = cert.userId?.email || "";
    if (to && cert.pdfPath) {
      try {
        const absolute = path.join(process.cwd(), String(cert.pdfPath).replace(/^[/\\]/, ""));
        if (fs.existsSync(absolute)) {
          await sendEmail({
            to,
            subject: `Your Certificate - ${cert.courseId?.title || "Course"}`,
            text:
              `Congratulations! Your certificate is now published.\n\n` +
              `Certificate No: ${cert.certNo}`,
            attachments: [{ filename: `${cert.certNo}.pdf`, path: absolute }],
          });
          cert.emailedAt = new Date();
          emailSent = true;
        }
      } catch (mailErr) {
        console.error("publishCertificate email failed:", mailErr?.message || mailErr);
      }
    }

    await cert.save();
    res.json({ certificate: cert, emailSent });
  } catch (err) {
    next(err);
  }
};

export const unpublishCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid certificate id" });
    }

    const cert = await Certificate.findByIdAndUpdate(
      id,
      { published: false, publishedAt: null },
      { new: true }
    );
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  } catch (err) {
    next(err);
  }
};

// Student picks certificate template and regenerates PDF
export const selectCertificateTemplate = async (req, res, next) => {
  try {
    const { courseId, templateKey } = req.body || {};
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Valid courseId required" });
    }
    if (!TEMPLATE_OPTIONS.some((t) => t.key === templateKey)) {
      return res.status(400).json({ message: "Invalid templateKey" });
    }

    const cert = await Certificate.findOne({ userId: req.user._id, courseId }).populate(
      "courseId"
    );
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found for this course" });
    }

    const issuedOn = formatIssuedOn(cert.issuedAt || new Date());
    const pdf = await generateCertificate({
      certificateId: cert.certificateId,
      studentName: req.user?.name || req.user?.email || "Student",
      studentEmail: req.user?.email || "",
      courseTitle: cert.courseId?.title || "Course",
      issuedOn,
      verifyUrl: buildVerifyUrl(cert.certificateId),
      templateKey,
    });

    cert.templateKey = templateKey;
    cert.pdfPath = pdf.pdfPath;
    await cert.save();

    res.json({
      message: "Template updated",
      certificateId: cert.certificateId,
      templateKey: cert.templateKey,
      pdfPath: cert.pdfPath,
    });
  } catch (err) {
    next(err);
  }
};

export const ensureCertificateForCompletion = async ({ user, courseId, score }) => {
  const existing = await Certificate.findOne({ userId: user._id, courseId });
  if (existing) return existing;

  const certificateId = `CERT-${Date.now()}`;
  const certNo = certificateId;
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found for certificate");

  const templateKey = "classic-blue";
  const issuedOn = formatIssuedOn(new Date());

  const pdf = await generateCertificate({
    certificateId,
    studentName: user?.name || user?.email || "Student",
    studentEmail: user?.email || "",
    courseTitle: course.title,
    issuedOn,
    score,
    verifyUrl: buildVerifyUrl(certificateId),
    templateKey,
  });

  const cert = await Certificate.create({
    userId: user._id,
    courseId,
    certificateId,
    certNo,
    pdfPath: pdf.pdfPath,
    pdfUrl: `${safeOrigin()}${pdf.pdfPath}`,
    templateKey,
    issuedAt: new Date(),
    published: false,
    publishedAt: null,
  });

  return cert;
};
