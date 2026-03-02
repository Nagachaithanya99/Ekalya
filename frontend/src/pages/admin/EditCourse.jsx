import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAllCoursesAdmin, updateCourse } from "../../services/courseService";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";

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

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllCoursesAdmin();
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find((c) => c._id === id);

        if (!found) {
          alert("Course not found");
          navigate("/admin/courses");
          return;
        }

        setOriginal(found);

        setForm({
          title: found.title || "",
          subtitle: found.subtitle || "",
          description: found.description || "",
          category: found.category || "General",
          level: found.level || "Beginner",
          price: found.price ?? 0,
          thumbnailUrl: found.thumbnailUrl || "",
          bannerUrl: found.bannerUrl || "",
          durationHours: found.durationHours ?? 0,
          language: found.language || "English",
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load course");
        navigate("/admin/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const dirty = useMemo(() => {
    if (!form || !original) return false;
    return (
      form.title !== (original.title || "") ||
      form.subtitle !== (original.subtitle || "") ||
      form.description !== (original.description || "") ||
      form.category !== (original.category || "General") ||
      form.level !== (original.level || "Beginner") ||
      Number(form.price || 0) !== Number(original.price || 0) ||
      form.thumbnailUrl !== (original.thumbnailUrl || "") ||
      form.bannerUrl !== (original.bannerUrl || "") ||
      Number(form.durationHours || 0) !== Number(original.durationHours || 0) ||
      form.language !== (original.language || "English")
    );
  }, [form, original]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      await updateCourse(id, {
        ...form,
        price: Number(form.price),
        durationHours: Number(form.durationHours),
      });
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading course..." />;
  if (!form) return null;

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
          ADMIN • COURSES • EDIT
        </p>

        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Edit <span className="text-gold">Course</span>
        </h1>

        <p className="mt-2 text-white/70 max-w-3xl">
          Update course details. Your changes won’t affect students until you publish updates (if your system needs).
        </p>

        <div className="mt-3 text-xs text-white/55">
          {dirty ? (
            <span className="text-yellow-300">● Unsaved changes</span>
          ) : (
            <span className="text-green-400">● No changes</span>
          )}
        </div>
      </motion.div>

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
            placeholder="General / Web / AI / ..."
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
          desc="Price, duration and language."
        />

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            value={form.price}
            onChange={onChange}
            min={0}
          />
          <Input
            label="Duration (hrs)"
            name="durationHours"
            type="number"
            value={form.durationHours}
            onChange={onChange}
            min={0}
          />
          <Input
            label="Language"
            name="language"
            value={form.language}
            onChange={onChange}
            placeholder="English"
          />
        </div>
      </motion.section>

      {/* 3) Media */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.11}
        className="glass rounded-3xl p-6"
      >
        <SectionTitle
          title="3) Media"
          desc="Thumbnail and banner URLs (optional)."
        />

        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <Input
            label="Thumbnail URL"
            name="thumbnailUrl"
            value={form.thumbnailUrl}
            onChange={onChange}
            placeholder="Paste image URL"
          />
          <Input
            label="Banner URL"
            name="bannerUrl"
            value={form.bannerUrl}
            onChange={onChange}
            placeholder="Paste banner URL"
          />
        </div>

        {(form.thumbnailUrl || form.bannerUrl) && (
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <PreviewCard title="Thumbnail Preview" url={form.thumbnailUrl} />
            <PreviewCard title="Banner Preview" url={form.bannerUrl} />
          </div>
        )}
      </motion.section>

      {/* 4) Description */}
      <motion.section
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.14}
        className="glass rounded-3xl p-6"
      >
        <SectionTitle
          title="4) Course Description"
          desc="This appears on the Course Details page."
        />

        <div className="mt-5">
          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Write course overview..."
          />
        </div>
      </motion.section>

      {/* Bottom Buttons */}
      <motion.div
        variants={sectionIn}
        initial="hidden"
        animate="show"
        custom={0.17}
        className="glass rounded-3xl p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
      >
        <p className="text-xs text-white/55">
          Save changes to update the course. Publishing is handled on Courses page.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/courses")}
            className="px-6 py-3 rounded-2xl bg-white/10 border border-white/15 hover:border-white/25"
          >
            Cancel
          </button>

          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            disabled={saving || !dirty}
            onClick={submit}
            className="px-7 py-3 rounded-2xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60 shadow-[0_12px_32px_rgba(247,215,116,0.18)]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- UI Helpers ---------------- */

function SectionTitle({ title, desc }) {
  return (
    <div>
      <p className="text-lg font-extrabold">{title}</p>
      {desc ? <p className="text-sm text-white/60 mt-1">{desc}</p> : null}
    </div>
  );
}

function PreviewCard({ title, url }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 h-40 grid place-items-center">
        {url ? (
          <img src={url} alt={title} className="h-40 w-full object-cover" />
        ) : (
          <span className="text-white/50 text-sm">No image</span>
        )}
      </div>
      {url ? (
        <p className="mt-2 text-xs text-white/55 truncate">{url}</p>
      ) : null}
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
