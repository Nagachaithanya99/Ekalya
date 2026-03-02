import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Loader from "../../components/Loader";
import { getBlogs } from "../../services/blogService";

export default function Blog() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getBlogs();
        setBlogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    for (const b of blogs) set.add(b.category || "General");
    return Array.from(set);
  }, [blogs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return blogs
      .filter((b) =>
        category === "All" ? true : (b.category || "General") === category
      )
      .filter((b) => {
        if (!q) return true;
        const t = `${b.title || ""} ${b.excerpt || ""} ${b.content || ""}`.toLowerCase();
        return t.includes(q);
      });
  }, [blogs, query, category]);

  const featured = filtered[0]; // first blog as featured
  const rest = filtered.slice(1);

  if (loading) return <Loader label="Loading blog posts..." />;

  return (
    <div className="space-y-8">
      {/* ================= HERO ================= */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 md:p-10 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative space-y-4 max-w-3xl">
          <p className="text-xs tracking-[0.25em] text-white/60 uppercase">
            Insights • Updates • Learning
          </p>

          <h1 className="text-3xl md:text-4xl font-extrabold">
            Platform <span className="text-gold">Blog</span>
          </h1>

          <p className="text-white/70 leading-relaxed">
            Read announcements, learning tips, and platform updates written by our team.
          </p>

          {/* Search */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 outline-none"
          />

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-2xl text-sm border transition ${
                    active
                      ? "bg-white/10 border-[rgba(247,215,116,0.25)] active-glow"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ================= FEATURED BLOG ================= */}
      {featured && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onClick={() => navigate(`/blog/${featured._id}`)}
          className="group cursor-pointer glass rounded-3xl p-6 md:p-8 grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-center"
        >
          <div>
            <span className="badge badge-done mb-3 inline-block">Featured</span>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-snug group-hover:text-gold transition-colors">
              {featured.title}
            </h2>
            <p className="mt-3 text-white/70 line-clamp-3 leading-relaxed">
              {featured.excerpt || featured.description || "Read this post."}
            </p>
            <p className="mt-4 text-sm text-white/50">
              {featured.category || "General"} • {formatDate(featured.createdAt)}
            </p>
          </div>

          {featured.coverImage ? (
            <img
              src={featured.coverImage}
              alt={featured.title}
              className="h-48 w-full rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <div className="h-48 w-full rounded-2xl border border-white/10 bg-white/5 grid place-items-center text-white/50">
              No Cover Image
            </div>
          )}
        </motion.section>
      )}

      {/* ================= BLOG GRID ================= */}
      {rest.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-white/70">
          No posts found. Try another search or category.
        </div>
      ) : (
        <motion.section
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {rest.map((b) => (
            <motion.article
              key={b._id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/blog/${b._id}`)}
              className="group cursor-pointer glass glass-hover rounded-3xl p-5"
            >
              {b.coverImage ? (
                <img
                  src={b.coverImage}
                  alt={b.title}
                  className="h-40 w-full rounded-2xl object-cover border border-white/10"
                  loading="lazy"
                />
              ) : (
                <div className="h-40 w-full rounded-2xl border border-white/10 bg-white/5 grid place-items-center text-white/50">
                  No Image
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="badge">{b.category || "General"}</span>
                <span className="text-xs text-white/50">
                  {formatDate(b.createdAt)}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-extrabold leading-snug group-hover:text-gold transition-colors">
                {b.title || "Untitled Post"}
              </h3>

              <p className="mt-2 text-sm text-white/70 line-clamp-3">
                {b.excerpt || b.description || "Click to read this post."}
              </p>

              <div className="mt-4 text-xs text-gold/90">Read →</div>
            </motion.article>
          ))}
        </motion.section>
      )}
    </div>
  );
}

/* -------- helpers -------- */
function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}
