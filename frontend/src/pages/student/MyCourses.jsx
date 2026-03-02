import { useEffect, useMemo, useState } from "react";
import { getMyCourses } from "../../services/enrollmentService";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

export default function MyCourses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state (no backend needed)
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | inprogress | completed

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    getMyCourses()
      .then((res) => {
        if (!mounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("MyCourses error:", err);
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((e) => (e.progressPercent ?? 0) >= 100).length;
    const inprogress = items.filter((e) => {
      const p = e.progressPercent ?? 0;
      return p > 0 && p < 100;
    }).length;
    return { total, completed, inprogress };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter((e) => {
        const title = (e.course?.title || "").toLowerCase();
        const desc = (
          e.course?.subtitle ||
          e.course?.description ||
          ""
        ).toLowerCase();

        const matchesText = !q || title.includes(q) || desc.includes(q);

        const p = e.progressPercent ?? 0;
        const matchesFilter =
          filter === "all" ||
          (filter === "completed" && p >= 100) ||
          (filter === "inprogress" && p > 0 && p < 100);

        return matchesText && matchesFilter;
      })
      .sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0));
  }, [items, query, filter]);

  if (loading) return <Loader label="Loading enrolled courses..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="aurora-line absolute top-0 left-0 right-0" />

        <div className="relative z-10 flex flex-col gap-3">
          <div>
            <p className="text-white/60 text-sm">Student Portal</p>
            <h1 className="mt-1 text-3xl font-extrabold">
              My <span className="text-gold">Courses</span>
            </h1>
            <p className="mt-2 text-white/65 max-w-2xl">
              Continue where you left off, track progress, and complete courses to unlock certificates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/courses" className="btn-gold">
              Browse Courses
            </Link>
            <button
              onClick={() => navigate("/student/progress")}
              className="btn-ghost"
            >
              View Progress
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats + Filters */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Stats */}
        <div className="glass rounded-3xl p-5 border border-white/10">
          <p className="text-white/60 text-sm">Overview</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat label="Enrolled" value={stats.total} />
            <MiniStat label="In Progress" value={stats.inprogress} />
            <MiniStat label="Completed" value={stats.completed} />
          </div>

          <div className="mt-4 text-white/60 text-sm">
            Tip: Completing 100% unlocks your certificate automatically.
          </div>
        </div>

        {/* Search + Filter */}
        <div className="lg:col-span-2 glass rounded-3xl p-5 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.18]" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm">Find your course</p>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="md:col-span-2 glass rounded-2xl px-4 py-3 border border-white/10 bg-transparent text-white placeholder:text-white/40"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="glass rounded-2xl px-4 py-3 border border-white/10 bg-transparent text-white"
              >
                <option value="all">All</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge">Sorted by progress</span>
              <span className="badge badge-done">Completed: {stats.completed}</span>
              <span className="badge badge-pending">In progress: {stats.inprogress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-8 border border-white/10 text-white/70">
          <p className="text-lg font-semibold">No enrollments yet</p>
          <p className="mt-1 text-white/60">
            Enroll in a course to start learning and track your progress here.
          </p>

          <div className="mt-4">
            <Link to="/courses" className="btn-gold">
              Explore Courses →
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-8 border border-white/10 text-white/70">
          No courses match your search/filter.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e, idx) => (
            <CourseTile
              key={e._id}
              e={e}
              idx={idx}
              onOpen={() => navigate(`/student/watch/${e.course?._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function MiniStat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-3 border border-white/10 bg-white/[0.04]">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-gold">{value}</p>
    </div>
  );
}

function CourseTile({ e, onOpen, idx }) {
  const title = e.course?.title || "Untitled Course";
  const desc =
    e.course?.subtitle || e.course?.description || "No description available";

  const progress = Math.min(100, Math.max(0, e.progressPercent ?? 0));
  const isCompleted = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * Math.min(idx, 6) }}
      whileHover={{ y: -4 }}
      className="glass rounded-3xl p-5 border border-white/10 hover:border-white/20 relative overflow-hidden"
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl"
        style={{
          background: isCompleted
            ? "rgba(0,209,255,0.18)"
            : "rgba(247,215,116,0.18)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg truncate">{title}</h3>
            <p className="text-white/65 text-sm mt-1 line-clamp-2">{desc}</p>
          </div>

          <span className={`badge ${isCompleted ? "badge-done" : "badge-pending"}`}>
            {isCompleted ? "Completed" : progress === 0 ? "Not started" : "In progress"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-white/70">
            Progress:{" "}
            <span className="text-gold font-semibold">{progress}%</span>
          </div>

          <button onClick={onOpen} className="btn-ghost py-2 px-4">
            {isCompleted ? "Review" : "Open"} →
          </button>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, var(--gold), var(--fire), var(--water))",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
