import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlogById } from "../../services/blogService";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiCopy,
  FiUser,
  FiTag,
  FiClock,
  FiCalendar,
} from "react-icons/fi";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1400&auto=format&fit=crop";

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getBlogById(id);
        setBlog(res.data || null);
      } catch (e) {
        console.error(e);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const meta = useMemo(() => {
    if (!blog) return null;

    const cover =
      blog.coverImageUrl || blog.coverImage || blog.imageUrl || FALLBACK_COVER;

    const category = blog.category || "General";
    const author =
      blog.authorName || blog.author || blog.createdBy || "Ekalya Learning Platform";
    const date = formatDate(blog.createdAt);

    const excerpt = blog.excerpt || blog.description || "";
    const content = blog.content || "No content yet.";

    // reading time estimate
    const words = String(content).trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 180));

    return { cover, category, author, date, excerpt, content, minutes };
  }, [blog]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      alert("Copy failed");
    }
  };

  if (loading) return <Loader label="Loading blog..." />;
  if (!blog || !meta) return <div className="text-white/70">Blog not found</div>;

  return (
    <div className="space-y-8">
      {/* ================= HERO ================= */}
      <section className="glass rounded-3xl overflow-hidden relative">
        <div className="relative">
          <img
            src={meta.cover}
            alt={blog.title}
            className="h-[420px] w-full object-cover opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

          {/* glow */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(247,215,116,0.18), transparent 55%)",
            }}
          />

          {/* top nav */}
          <div className="absolute top-5 left-5">
            <button
              onClick={() => navigate("/blog")}
              className="btn-ghost !py-2 inline-flex items-center gap-2"
            >
              <FiArrowLeft /> Blog
            </button>
          </div>

          {/* title */}
          <div className="absolute bottom-6 left-6 right-6">
            <motion.h1
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-extrabold leading-tight max-w-4xl"
            >
              {blog.title || "Untitled Post"}
            </motion.h1>

            {meta.excerpt && (
              <p className="text-white/75 mt-3 max-w-3xl leading-relaxed">
                {meta.excerpt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
              <Meta icon={<FiTag />} label={meta.category} />
              <Meta icon={<FiUser />} label={meta.author} />
              {meta.date && <Meta icon={<FiCalendar />} label={meta.date} />}
              <Meta icon={<FiClock />} label={`${meta.minutes} min read`} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENT ================= */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Article */}
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="max-w-none text-white/85 leading-[1.9] text-[15px] md:text-[16px] whitespace-pre-wrap">
            {meta.content}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost">
              ← Back
            </button>
            <button onClick={() => navigate("/blog")} className="btn-ghost">
              All posts
            </button>
          </div>
        </motion.article>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="glass rounded-3xl p-6">
            <h3 className="font-bold">Post details</h3>

            <div className="mt-4 space-y-3 text-sm text-white/75">
              <InfoRow label="Category" value={meta.category} />
              <InfoRow label="Author" value={meta.author} />
              <InfoRow label="Published" value={meta.date || "—"} />
              <InfoRow label="Read time" value={`${meta.minutes} min`} />
            </div>

            <button
              onClick={copyLink}
              className="mt-5 w-full btn-ghost inline-flex items-center justify-center gap-2"
            >
              <FiCopy />
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>

          <div className="glass rounded-3xl p-6">
            <h4 className="font-bold">Explore more</h4>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Discover courses related to this topic and start learning with
              hands-on lessons and certificates.
            </p>

            <button
              onClick={() => navigate("/courses")}
              className="mt-4 w-full px-4 py-3 rounded-xl bg-[#f7d774] text-black font-extrabold hover:opacity-90"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Meta({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
      <span className="text-white/70">{icon}</span>
      <span className="text-white/70">{label}</span>
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/50">{label}</span>
      <span className="text-white/85 font-semibold text-right">{value}</span>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}
