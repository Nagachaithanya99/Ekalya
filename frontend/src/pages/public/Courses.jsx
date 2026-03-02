import { useEffect, useMemo, useState } from "react";
import { getPublicCourses } from "../../services/courseService";
import CourseCard from "../../components/CourseCard";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured"); // featured | newest | az
  const [category, setCategory] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getPublicCourses();
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list);
      } catch (e) {
        console.error(e);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const c of courses) {
      const cat = String(c.category || "").trim();
      if (cat) set.add(cat);
    }
    return ["all", ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = courses.slice();

    // category filter
    if (category !== "all") {
      list = list.filter(
        (c) => String(c.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    // search filter
    if (q) {
      list = list.filter((c) => {
        const t = (c.title || "").toLowerCase();
        const d = (c.description || "").toLowerCase();
        const s = (c.subtitle || "").toLowerCase();
        return t.includes(q) || d.includes(q) || s.includes(q);
      });
    }

    // sort
    if (sort === "az") {
      list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    } else if (sort === "newest") {
      list.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    } else {
      // ✅ featured first (then featuredOrder, then newest)
      list.sort((a, b) => {
        const fa = Number(!!a.featured);
        const fb = Number(!!b.featured);
        if (fb !== fa) return fb - fa;

        const oa = Number(a.featuredOrder || 0);
        const ob = Number(b.featuredOrder || 0);
        if (ob !== oa) return ob - oa;

        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

    return list;
  }, [courses, query, sort, category]);

  const hasActiveFilters = query.trim() || category !== "all" || sort !== "featured";

  if (loading) return <Loader label="Loading courses..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold">
          Browse <span className="text-gold">Courses</span>
        </h1>
        <p className="text-white/70 max-w-2xl leading-relaxed">
          Explore published courses. Enroll, learn with video lessons, track progress, and unlock certificates.
        </p>
      </motion.div>

      {/* Quick category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 10).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-2xl text-sm border transition ${
                  active
                    ? "bg-white/10 border-[rgba(247,215,116,0.25)] active-glow"
                    : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1">
          <label className="text-xs text-white/60">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses (title, subtitle, description)…"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="min-w-[180px]">
            <label className="text-xs text-white/60">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[190px]">
            <label className="text-xs text-white/60">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <option value="featured">Featured first</option>
              <option value="newest">Newest</option>
              <option value="az">A → Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-white/60">
        <p>
          Showing{" "}
          <span className="text-white/90 font-semibold">{filtered.length}</span>{" "}
          course{filtered.length === 1 ? "" : "s"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {query.trim() ? (
            <span className="badge">Search: {query.trim()}</span>
          ) : null}
          {category !== "all" ? <span className="badge">Category: {category}</span> : null}
          {sort !== "featured" ? <span className="badge">Sort: {sort}</span> : null}

          {hasActiveFilters ? (
            <button
              className="btn-ghost py-2"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setSort("featured");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-white/70">
          No courses match your search/filter.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, idx) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              {/* ✅ no double-glass wrapper */}
              <CourseCard course={c} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
