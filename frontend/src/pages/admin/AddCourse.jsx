import { useMemo, useState } from "react";
import { createCourse } from "../../services/courseService";
import { useUploadService } from "../../services/uploadService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";

const pageIn = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const sectionIn = {
  hidden: { opacity: 0, y: 10 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: d, ease: "easeOut" },
  }),
};

export default function AddCourse() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { uploadFile } = useUploadService();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ thumbnail: false, banner: false });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "General",
    level: "Beginner",
    price: 0,
    thumbnail: "",
    bannerUrl: "",
    durationHours: 0,
    language: "English",
  });

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (saving || uploading.thumbnail || uploading.banner) return false;
    return true;
  }, [form.title, saving, uploading.thumbnail, uploading.banner]);

  // ✅ Upload thumbnail to Cloudinary
  const uploadThumbnail = async (fileArg = thumbnailFile) => {
    if (!fileArg) return alert("Select an image first");

    setUploading((p) => ({ ...p, thumbnail: true }));
    try {
      const { url } = await uploadFile(fileArg, "image");
      setForm((p) => ({ ...p, thumbnail: url }));
      setThumbnailFile(null);
    } catch (err) {
      console.error(err);
      alert("Thumbnail upload failed");
    } finally {
      setUploading((p) => ({ ...p, thumbnail: false }));
    }
  };

  const uploadBanner = async (fileArg = bannerFile) => {
    if (!fileArg) return alert("Select an image first");

    setUploading((p) => ({ ...p, banner: true }));
    try {
      const { url } = await uploadFile(fileArg, "image");
      setForm((p) => ({ ...p, bannerUrl: url }));
      setBannerFile(null);
    } catch (err) {
      console.error(err);
      alert("Banner upload failed");
    } finally {
      setUploading((p) => ({ ...p, banner: false }));
    }
  };

  // ✅ Submit course
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      const token = await getToken();

      await createCourse(
        {
          ...form,
          price: Number(form.price),
          durationHours: Number(form.durationHours),
        },
        token
      );

      navigate("/admin/courses");
    } catch (err) {
      console.error(err);
      alert("Create course failed");
    } finally {
      setSaving(false);
    }
  };

  const onThumbnailFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (!file) return;
    await uploadThumbnail(file);
  };

  const onBannerFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    if (!file) return;
    await uploadBanner(file);
  };

  return (
    <motion.div
      variants={pageIn}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={sectionIn} initial="hidden" animate="show" custom={0}>
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • COURSES • CREATE
        </p>

        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Add <span className="text-gold">Course</span>
        </h1>

        <p className="mt-2 text-white/70 max-w-3xl">
          Fill course details step-by-step. Course will start as{" "}
          <span className="text-gold font-semibold">Draft</span>. You can publish it
          later from the Courses page.
        </p>
      </motion.div>

      {/* SINGLE COLUMN FORM */}
      <form onSubmit={submit} className="space-y-6">
        {/* 1) Basics */}
        <motion.section
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.05}
          className="glass rounded-3xl p-6"
        >
          <SectionTitle
            title="1) Basics"
            desc="Title, category, level and subtitle."
          />

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <Input
              label="Title *"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Eg: Full Stack MERN Bootcamp"
            />

            <Input
              label="Category"
              name="category"
              value={form.category}
              onChange={onChange}
              placeholder="Eg: Web Development"
            />

            <Input
              label="Subtitle"
              name="subtitle"
              value={form.subtitle}
              onChange={onChange}
              placeholder="Short one-line summary"
            />

            <Select
              label="Level"
              name="level"
              value={form.level}
              onChange={onChange}
              options={["Beginner", "Intermediate", "Advanced"]}
            />
          </div>
        </motion.section>

        {/* 2) Pricing & Details */}
        <motion.section
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.08}
          className="glass rounded-3xl p-6"
        >
          <SectionTitle
            title="2) Pricing & Details"
            desc="Price, duration, language."
          />

          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <Input
              label="Price (₹)"
              name="price"
              type="number"
              value={form.price}
              onChange={onChange}
            />

            <Input
              label="Duration (hrs)"
              name="durationHours"
              type="number"
              value={form.durationHours}
              onChange={onChange}
            />

            <Input
              label="Language"
              name="language"
              value={form.language}
              onChange={onChange}
            />
          </div>
        </motion.section>

        {/* 3) Thumbnail (in order) */}
        <motion.section
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.11}
          className="glass rounded-3xl p-6"
        >
          <SectionTitle
            title="3) Thumbnail"
            desc="This appears on course cards."
          />

          {/* Preview */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {form.thumbnail ? (
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-48 w-full grid place-items-center text-white/50 text-sm">
                No thumbnail yet
              </div>
            )}
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Input
              label="Thumbnail URL (optional)"
              value={form.thumbnail}
              onChange={(e) =>
                setForm((p) => ({ ...p, thumbnail: e.target.value }))
              }
              placeholder="Paste image URL..."
            />

            {/* Upload */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70 font-semibold">
                Or Upload Thumbnail
              </p>
              <p className="text-xs text-white/50 mt-1">
                Recommended: 16:9 landscape (1200×675)
              </p>

              <div className="mt-3 flex flex-col gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onThumbnailFileChange}
                    className="hidden"
                  />
                  <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition text-sm text-white/70">
                    {thumbnailFile
                      ? `Selected: ${thumbnailFile.name}`
                      : "Choose thumbnail file"}
                  </div>
                </label>

                <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm font-semibold text-white/85">
                  {uploading.thumbnail ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      Uploading thumbnail...
                    </span>
                  ) : form.thumbnail ? (
                    "Uploading completed"
                  ) : (
                    "Auto-upload starts after file selection"
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-white/55">
            Tip: Thumbnail makes your course cards look premium.
          </p>
        </motion.section>

        {/* 4) Banner */}
        <motion.section
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.14}
          className="glass rounded-3xl p-6"
        >
          <SectionTitle
            title="4) Banner (optional)"
            desc="Shown on Course Details page banner."
          />

          <Input
            label="Banner URL"
            name="bannerUrl"
            value={form.bannerUrl}
            onChange={onChange}
            placeholder="Paste banner image URL..."
          />

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70 font-semibold">Or Upload Banner</p>
            <p className="text-xs text-white/50 mt-1">
              Recommended: 16:9 landscape (1920x1080)
            </p>

            <div className="mt-3 flex flex-col gap-3 md:max-w-md">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onBannerFileChange}
                  className="hidden"
                />
                <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition text-sm text-white/70">
                  {bannerFile ? `Selected: ${bannerFile.name}` : "Choose banner file"}
                </div>
              </label>

              <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm font-semibold text-white/85">
                {uploading.banner ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Uploading banner...
                  </span>
                ) : form.bannerUrl ? (
                  "Uploading completed"
                ) : (
                  "Auto-upload starts after file selection"
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/55">
            If empty, Course Details will use thumbnail.
          </p>
        </motion.section>

        {/* 5) Description */}
        <motion.section
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.17}
          className="glass rounded-3xl p-6"
        >
          <SectionTitle
            title="5) Course Description"
            desc="Explain what the student will learn."
          />

          <div className="mt-4">
            <Textarea
              label="Description"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Write course details, outcomes, and what students will learn..."
            />
          </div>
        </motion.section>

        {/* ✅ BUTTONS AT LAST (ONLY) */}
        <motion.div
          variants={sectionIn}
          initial="hidden"
          animate="show"
          custom={0.2}
          className="glass rounded-3xl p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
        >
          <div className="text-sm text-white/60">
            Status: <span className="text-yellow-300 font-semibold">Draft</span>{" "}
            — publish later from Admin Courses.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/courses")}
              className="px-6 py-3 rounded-2xl bg-white/10 border border-white/15 hover:border-white/25 hover:bg-white/15 transition"
            >
              Cancel
            </button>

            <motion.button
              whileHover={{ scale: canSubmit ? 1.02 : 1 }}
              whileTap={{ scale: canSubmit ? 0.98 : 1 }}
              disabled={!canSubmit}
              type="submit"
              className="px-7 py-3 rounded-2xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60 shadow-[0_12px_32px_rgba(247,215,116,0.18)]"
            >
              {saving ? "Saving..." : "Create Course"}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}

/* ---------------- Small UI components ---------------- */

function SectionTitle({ title, desc }) {
  return (
    <div>
      <p className="text-lg font-extrabold">{title}</p>
      {desc ? <p className="text-sm text-white/60 mt-1">{desc}</p> : null}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none transition
        focus:border-[#f7d774]/40 hover:border-white/20"
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <textarea
        {...props}
        rows={6}
        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none transition
        focus:border-[#f7d774]/40 hover:border-white/20"
      />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <select
        {...props}
        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none transition
        focus:border-[#f7d774]/40 hover:border-white/20"
      >
        {options.map((op) => (
          <option key={op} value={op} className="bg-black">
            {op}
          </option>
        ))}
      </select>
    </label>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}
