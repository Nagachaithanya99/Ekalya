import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiEdit2, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop";

function isNew(createdAt) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

// ✅ slide theme colors
const TINT = {
  gold: {
    accent: "rgba(255,197,84,0.95)",
    accentSoft: "rgba(255,197,84,0.14)",
    glow: "rgba(255,197,84,0.25)",
    ring: "rgba(255,197,84,0.35)",
    bgSoft: "linear-gradient(135deg, rgba(255,197,84,0.08), rgba(255,255,255,0.03))",
    bgHover:
      "linear-gradient(135deg, rgba(255,197,84,0.12), rgba(255,255,255,0.04))",
  },
  fire: {
    accent: "rgba(255,105,45,0.95)",
    accentSoft: "rgba(255,105,45,0.14)",
    glow: "rgba(255,105,45,0.25)",
    ring: "rgba(255,105,45,0.35)",
    bgSoft: "linear-gradient(135deg, rgba(255,105,45,0.08), rgba(255,255,255,0.03))",
    bgHover:
      "linear-gradient(135deg, rgba(255,105,45,0.12), rgba(255,255,255,0.04))",
  },
  water: {
    accent: "rgba(54,210,255,0.92)",
    accentSoft: "rgba(54,210,255,0.14)",
    glow: "rgba(54,210,255,0.22)",
    ring: "rgba(54,210,255,0.33)",
    bgSoft: "linear-gradient(135deg, rgba(54,210,255,0.08), rgba(255,255,255,0.03))",
    bgHover:
      "linear-gradient(135deg, rgba(54,210,255,0.12), rgba(255,255,255,0.04))",
  },
};


export default function CourseCard({
  course,
  admin = false,
  onEdit,
  onDelete,
  onPublishToggle,
  tint = "gold", // ✅ NEW
}) {
  const theme = TINT[tint] || TINT.gold;

  const price = Number(course?.price || 0);
  const level = course?.level || "Beginner";
  const category = course?.category || "General";
  const published = !!course?.published;

  const lessonsCount = course?.lessonsCount ?? course?.totalLessons ?? null;
  const duration = course?.duration ?? course?.durationText ?? null;

  const rating = course?.rating ?? null;
  const students = course?.studentsCount ?? course?.enrolledCount ?? null;
  const featured = !!course?.featured;
  const newBadge = isNew(course?.createdAt);
  const canPublish =
    !!course?.lessonsFinalized && !!course?.quizzesFinalized && !!course?.finalQuizId;
  const publishBlocked = admin && !published && !canPublish;

  const badgeText = featured ? "Featured" : newBadge ? "New" : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-white/20"
      style={{
        boxShadow: `0 0 0 rgba(0,0,0,0)`,
      }}
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={course?.thumbnailUrl || FALLBACK_IMG}
          alt={course?.title || "Course"}
          className="h-52 w-full object-cover opacity-90 group-hover:opacity-100 transition duration-300 scale-[1.02] group-hover:scale-[1.06]"
          loading="lazy"
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* ✅ hover glow uses tint */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${theme.accentSoft}, transparent 55%)`,
          }}
        />

        {/* top chips */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/15 backdrop-blur">
            {category}
          </span>

          <div className="flex items-center gap-2">
            {badgeText && (
              <span
                className="px-3 py-1 rounded-full text-xs border backdrop-blur inline-flex items-center gap-1"
                style={{
                  borderColor: theme.ring,
                  background: theme.accentSoft,
                }}
              >
                <HiSparkles className="text-[14px]" />
                {badgeText}
              </span>
            )}

            <span
              className="px-3 py-1 rounded-full text-xs border backdrop-blur"
              style={{
                borderColor: published
                  ? "rgba(0,209,255,0.35)"
                  : "rgba(255,77,46,0.35)",
                background: published
                  ? "rgba(0,209,255,0.12)"
                  : "rgba(255,77,46,0.12)",
              }}
            >
              {published ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {/* bottom title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-white/70">Course</p>
          <h3 className="text-lg font-extrabold leading-snug line-clamp-2">
            {course?.title || "Untitled Course"}
          </h3>

          {/* tiny meta row (optional) */}
          <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
            {rating != null && (
              <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                ⭐ {rating}
              </span>
            )}
            {students != null && (
              <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                👥 {students}
              </span>
            )}
            {duration && (
              <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                ⏱ {duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <p className="text-white/65 text-sm line-clamp-2 leading-relaxed">
          {course?.subtitle || course?.description || "No description yet."}
        </p>

        {/* meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-xl text-xs bg-white/5 border border-white/10">
            Level: <span className="text-white/85 font-semibold">{level}</span>
          </span>

          {lessonsCount != null && (
            <span className="px-3 py-1 rounded-xl text-xs bg-white/5 border border-white/10">
              Lessons:{" "}
              <span className="text-white/85 font-semibold">{lessonsCount}</span>
            </span>
          )}

          {duration && (
            <span className="px-3 py-1 rounded-xl text-xs bg-white/5 border border-white/10">
              Duration: <span className="text-white/85 font-semibold">{duration}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-white/70">
            <span className="font-extrabold" style={{ color: theme.accent }}>
              ₹{price}
            </span>{" "}
            <span className="text-white/40">•</span>{" "}
            <span className="text-white/70">{level}</span>
          </div>

          {!admin ? (
            <Link
              to={`/courses/${course?._id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-black font-extrabold group/btn"
              style={{
                background: theme.accent,
                boxShadow: `0 12px 28px ${theme.glow}`,
              }}
            >
              View
              <FiArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={publishBlocked}
                onClick={() => onPublishToggle?.(course)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                  publishBlocked
                    ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/10 border-white/15 hover:border-white/25 hover:bg-white/15"
                }`}
                title={
                  published
                    ? "Unpublish course"
                    : publishBlocked
                    ? "Finalize lessons and quizzes first to publish"
                    : "Publish course"
                }
              >
                <FiUploadCloud />
                {published ? "Unpublish" : "Publish"}
              </button>

              <button
                onClick={() => onEdit?.(course)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:border-white/25 hover:bg-white/15 transition"
                title="Edit course"
              >
                <FiEdit2 />
                Edit
              </button>

              <button
                onClick={() => onDelete?.(course)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white font-extrabold hover:opacity-90 transition"
                style={{ background: "rgba(255,51,68,0.95)" }}
                title="Delete course"
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
