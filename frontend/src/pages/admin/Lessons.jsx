// frontend/src/pages/admin/Lessons.jsx
import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader";
import { getAllCoursesAdmin } from "../../services/courseService";
import {
  createLesson,
  deleteLesson,
  getLessonsByCourse,
  updateLesson, // ✅ ADD THIS in lessonService
} from "../../services/lessonService";
import { useUploadService } from "../../services/uploadService";
import { motion } from "framer-motion";
import { adminFinalizeLessons } from "../../services/courseLifecycleService";

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

export default function Lessons() {
  const { uploadFileWithProgress } = useUploadService();

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [lessons, setLessons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizingLessons, setFinalizingLessons] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const [videoFile, setVideoFile] = useState(null);

  // ✅ Edit state
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    pdfUrl: "",
    order: 1,
    isFreePreview: false,
  });

  /* ---------------- Load data ---------------- */

  const loadCourses = async () => {
    const res = await getAllCoursesAdmin();
    setCourses(Array.isArray(res.data) ? res.data : []);
  };

  const loadLessons = async (cid) => {
    if (!cid) return setLessons([]);
    const res = await getLessonsByCourse(cid);
    setLessons(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadCourses();
      } catch (err) {
        console.error(err);
        alert("Failed to load courses");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadLessons(courseId);
    // reset edit when course changes
    setEditingId(null);
    setVideoFile(null);
    setForm({
      title: "",
      description: "",
      videoUrl: "",
      pdfUrl: "",
      order: 1,
      isFreePreview: false,
    });
  }, [courseId]);

  /* ---------------- Form handlers ---------------- */

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setVideoFile(null);
    setForm({
      title: "",
      description: "",
      videoUrl: "",
      pdfUrl: "",
      order: 1,
      isFreePreview: false,
    });
  };

  const fillEdit = (lesson) => {
    setEditingId(lesson._id);
    setVideoFile(null); // if editing, start without file
    setForm({
      title: lesson.title || "",
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || "",
      order: Number(lesson.order || 1),
      isFreePreview: !!lesson.isFreePreview,
    });

    // scroll to form smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!courseId) return alert("Select a course");
    if (!form.title.trim()) return alert("Lesson title required");

    // For CREATE: require at least video file OR video URL
    // For EDIT: allow keeping existing videoUrl (already in form) even if no new file
    if (!editingId) {
      if (!form.videoUrl.trim()) {
        return alert("Upload a video file OR provide a video URL");
      }
    } else {
      // edit mode: if user clears url and no file -> invalid
      if (!form.videoUrl.trim()) {
        return alert("Provide a video URL OR upload a new video file");
      }
    }
    if (videoUploading) {
      return alert("Video upload is still running. Please wait.");
    }

    setSaving(true);
    try {
      // Using FormData so backend can accept file if provided
      const fd = new FormData();
      fd.append("courseId", courseId);
      fd.append("title", form.title.trim());
      fd.append("description", form.description || "");
      fd.append("order", String(Number(form.order ?? 1)));
      fd.append("isFreePreview", String(!!form.isFreePreview));

      // ✅ Fast path: save lesson with already-uploaded video URL
      fd.append("videoUrl", form.videoUrl.trim());

      // ✅ PDF (URL only)
      if (form.pdfUrl?.trim()) fd.append("pdfUrl", form.pdfUrl.trim());

      if (editingId) {
        await updateLesson(editingId, fd);
        alert("Lesson updated ✅");
      } else {
        await createLesson(fd);
        alert("Lesson added ✅");
      }

      resetForm();
      await loadLessons(courseId);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err?.message || "Failed to save lesson";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this lesson?")) return;

    try {
      await deleteLesson(id);
      // if deleting the lesson that is being edited
      if (editingId === id) resetForm();
      await loadLessons(courseId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete lesson");
    }
  };

  const selectedCourse = useMemo(
    () => courses.find((c) => c._id === courseId),
    [courses, courseId]
  );

  const sortedLessons = useMemo(() => {
    const list = lessons.slice();
    list.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    return list;
  }, [lessons]);

  const handleFinalizeLessons = async () => {
    if (!courseId) return alert("Select a course first.");
    if (!sortedLessons.length) {
      return alert("Add at least one lesson before finalizing lessons.");
    }
    if (selectedCourse?.lessonsFinalized) {
      return alert("Lessons are already finalized for this course.");
    }

    try {
      setFinalizingLessons(true);
      const res = await adminFinalizeLessons(courseId);
      alert(res?.data?.message || "Lessons finalized successfully.");
      await Promise.all([loadCourses(), loadLessons(courseId)]);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err?.message || "Failed to finalize lessons";
      alert(msg);
    } finally {
      setFinalizingLessons(false);
    }
  };

  if (loading) return <Loader label="Loading courses..." />;

  const startVideoUpload = async (file) => {
    if (!file) return;
    setVideoUploading(true);
    setVideoUploadProgress(0);
    try {
      const { url } = await uploadFileWithProgress(file, "video", (pct) =>
        setVideoUploadProgress(pct)
      );
      setForm((p) => ({ ...p, videoUrl: url }));
    } catch (err) {
      console.error(err);
      alert(err?.message || "Video upload failed");
      setVideoFile(null);
    } finally {
      setVideoUploading(false);
    }
  };

  return (
    <>
      <motion.div
        variants={pageIn}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
      {/* Header */}
      <motion.div variants={sectionIn} initial="hidden" animate="show" custom={0}>
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • COURSES • LESSONS
        </p>

        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Manage <span className="text-gold">Lessons</span>
        </h1>

        <p className="mt-2 text-white/70 max-w-3xl">
          Select a course, add lessons with video + optional PDF, set lesson order,
          and mark free preview lessons.
        </p>
      </motion.div>

      {/* 1) Select Course */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.05}
        className="glass rounded-3xl p-6"
      >
        <SectionTitle
          title="1) Select Course"
          desc="Choose which course you want to manage lessons for."
        />

        <div className="mt-5 grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <label className="space-y-1 text-sm block">
            <span className="text-white/70">Course</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none transition
                focus:border-[#f7d774]/40 hover:border-white/20"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id} className="bg-black">
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            {selectedCourse ? (
              <>
                <p className="font-semibold truncate">{selectedCourse.title}</p>
                <p className="text-xs text-white/55 truncate mt-0.5">
                  {selectedCourse.category || "General"} •{" "}
                  {selectedCourse.level || "Beginner"} •{" "}
                  {selectedCourse.published ? (
                    <span className="text-green-400">Published</span>
                  ) : (
                    <span className="text-yellow-300">Draft</span>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {selectedCourse.lessonsFinalized ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-200">
                      Lessons Finalized
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-200">
                      Lessons Not Finalized
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleFinalizeLessons}
                    disabled={
                      finalizingLessons ||
                      selectedCourse.lessonsFinalized ||
                      sortedLessons.length === 0
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#f7d774] text-black text-xs font-extrabold disabled:opacity-60"
                    title={
                      sortedLessons.length === 0
                        ? "Add at least one lesson first"
                        : selectedCourse.lessonsFinalized
                        ? "Already finalized"
                        : "Finalize all current lessons"
                    }
                  >
                    {finalizingLessons ? "Finalizing..." : "Finalize Lessons"}
                  </button>
                </div>
              </>
            ) : (
              <p>Select a course to view/add lessons.</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* 2) Add / Edit Lesson */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.08}
        className="glass rounded-3xl p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <SectionTitle
            title={editingId ? "2) Edit Lesson" : "2) Add Lesson"}
            desc="Fill details step-by-step (one-by-one)."
          />

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 hover:border-white/25"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Lesson Title *"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Eg: Introduction to MERN"
            />
            <Input
              label="Order"
              name="order"
              type="number"
              value={form.order}
              onChange={onChange}
              min={1}
            />
          </div>

          {/* Video input (URL OR Upload) */}
          <div className="glass rounded-2xl p-4 border border-white/10 bg-white/5">
            <p className="font-semibold">Video Source</p>
            <p className="text-xs text-white/55 mt-1">
              Provide a direct mp4/Cloudinary URL OR upload from your device.
            </p>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <Input
                label="Video URL"
                name="videoUrl"
                value={form.videoUrl}
                onChange={onChange}
                placeholder="Direct .mp4 or Cloudinary URL"
                disabled={!!videoFile}
              />

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm text-white/70 font-semibold">
                  Or Upload Video
                </p>

                <label className="mt-3 cursor-pointer block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0] || null;
                      setVideoFile(f);
                      if (f) {
                        setForm((p) => ({ ...p, videoUrl: "" }));
                        await startVideoUpload(f);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition text-sm text-white/70">
                    {videoFile ? `Selected: ${videoFile.name}` : "Choose file (auto-upload)"}
                  </div>
                </label>

                {videoFile ? (
                  <p className="mt-2 text-xs text-green-400 truncate">
                    {videoUploading
                      ? `Uploading: ${videoUploadProgress}%`
                      : `✅ Uploaded: ${videoFile.name}`}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-white/50">No file selected</p>
                )}

                {videoFile && (
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="mt-3 w-full px-4 py-2 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition text-sm"
                  >
                    Remove selected file
                  </button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="PDF URL (optional)"
            name="pdfUrl"
            value={form.pdfUrl}
            onChange={onChange}
            placeholder="If you have notes PDF link, paste here"
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Short lesson description (optional)"
          />

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              name="isFreePreview"
              checked={form.isFreePreview}
              onChange={onChange}
            />
            Free Preview Lesson
          </label>

          {/* Buttons bottom */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between pt-2">
            <p className="text-xs text-white/55">
              Tip: Set order properly (1,2,3...) to show lessons in correct
              sequence.
            </p>

            <motion.button
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              disabled={saving || !courseId || videoUploading}
              className="px-7 py-3 rounded-2xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60 shadow-[0_12px_32px_rgba(247,215,116,0.18)]"
            >
              {saving
                ? "Saving..."
                : videoUploading
                ? `Uploading video... ${videoUploadProgress}%`
                : editingId
                ? "Update Lesson"
                : "Add Lesson"}
            </motion.button>
          </div>
        </form>
      </motion.section>

      {/* 3) Lessons List */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.11}
        className="glass rounded-3xl p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <SectionTitle
            title="3) Lessons List"
            desc={
              courseId ? "Lessons for selected course." : "Select a course to see lessons."
            }
          />
          <div className="text-sm text-white/60">
            Total:{" "}
            <span className="text-white/90 font-semibold">
              {sortedLessons.length}
            </span>
          </div>
        </div>

        {!courseId ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60 text-sm">
            Please select a course first.
          </div>
        ) : sortedLessons.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60 text-sm">
            No lessons yet. Add your first lesson above.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {sortedLessons.map((l) => (
              <div
                key={l._id}
                className={`rounded-2xl border p-4 flex items-start justify-between gap-4 transition
                  ${
                    editingId === l._id
                      ? "border-[#f7d774]/35 bg-[#f7d774]/[0.06]"
                      : "border-white/10 bg-white/5"
                  }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
                      #{Number(l.order || 0)}
                    </span>

                    {l.isFreePreview ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-200">
                        Free Preview
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/60">
                        Paid
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-extrabold truncate">{l.title}</p>

                  <p className="mt-1 text-xs text-white/60 truncate">
                    {l.videoUrl ? "🎥 Video" : "— No video"} {l.pdfUrl ? " • 📄 PDF" : ""}
                  </p>

                  {l.description ? (
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">
                      {l.description}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 flex gap-2">
                  <button
                    onClick={() => fillEdit(l)}
                    className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 hover:border-[#f7d774]/40 font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => remove(l._id)}
                    className="px-4 py-2 rounded-2xl bg-red-500/90 hover:bg-red-500 text-white font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
      </motion.div>

      {(saving && !editingId) || videoUploading ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/65 px-4">
          <div className="glass rounded-3xl border border-white/15 px-6 py-5 w-full max-w-sm text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15">
              <Spinner />
            </div>
            <p className="text-lg font-extrabold">
              {videoUploading ? "Uploading Video" : "Saving Lesson"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {videoUploading
                ? `Please wait... ${videoUploadProgress}%`
                : "Please wait while we upload and save this lesson."}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ---------------- UI Components ---------------- */

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
        focus:border-[#f7d774]/40 hover:border-white/20 disabled:opacity-60"
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
        rows={4}
        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none transition
        focus:border-[#f7d774]/40 hover:border-white/20"
      />
    </label>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/35 border-t-[#f7d774]"
      aria-hidden="true"
    />
  );
}
