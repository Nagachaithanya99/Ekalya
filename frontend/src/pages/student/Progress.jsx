import { useEffect, useMemo, useState } from "react";
import { getMyCourses } from "../../services/enrollmentService";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Progress() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses()
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((e) => e.completed).length;
    const avg =
      total === 0
        ? 0
        : Math.round(
            items.reduce((sum, e) => sum + (e.progressPercent || 0), 0) / total
          );
    return { total, completed, avg };
  }, [items]);

  if (loading) return <Loader label="Loading progress..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="aurora-line absolute top-0 left-0 right-0" />

        <div className="relative z-10">
          <p className="text-white/60 text-sm">Learning Analytics</p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Course <span className="text-gold">Progress</span>
          </h1>
          <p className="mt-2 text-white/65 max-w-2xl">
            Monitor how far you’ve progressed in each course and identify what to
            complete next.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/student/my-courses" className="btn-gold">
              Continue Learning
            </Link>
            <Link to="/student/certificates" className="btn-ghost">
              View Certificates
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-5">
        <SummaryCard label="Enrolled Courses" value={stats.total} />
        <SummaryCard label="Completed Courses" value={stats.completed} />
        <SummaryCard label="Average Progress" value={`${stats.avg}%`} />
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-8 border border-white/10 text-white/70">
          <p className="text-lg font-semibold">No progress data yet</p>
          <p className="mt-1 text-white/60">
            Enroll in a course and start watching lessons to see your progress here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((e, idx) => {
            const progress = Math.min(100, e.progressPercent || 0);
            const completed = e.completed;

            return (
              <motion.div
                key={e._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * Math.min(idx, 6) }}
                className="glass rounded-3xl p-5 border border-white/10 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-lg truncate">
                      {e.course?.title || "Untitled Course"}
                    </h3>
                    <p className="text-sm text-white/60 mt-1">
                      {completed
                        ? "All lessons completed"
                        : "Lessons in progress"}
                    </p>
                  </div>

                  <span
                    className={`badge ${
                      completed ? "badge-done" : "badge-pending"
                    }`}
                  >
                    {completed ? "Completed" : "In Progress"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Completion</span>
                    <span className="text-gold font-semibold">{progress}%</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
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

                {/* Hint */}
                <div className="mt-3 text-xs text-white/55">
                  {completed
                    ? "🎓 Certificate unlocked for this course."
                    : "📌 Complete remaining lessons to unlock certificate."}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function SummaryCard({ label, value }) {
  return (
    <div className="glass rounded-3xl p-5 border border-white/10">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-gold">{value}</p>
    </div>
  );
}
