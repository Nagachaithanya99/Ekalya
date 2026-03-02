import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardCard from "../../components/DashboardCard";
import Loader from "../../components/Loader";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [coursesCount, setCoursesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);

  // ✅ Blogs: Published + Total
  const [blogsCount, setBlogsCount] = useState({ total: 0, published: 0 });

  const [messagesCount, setMessagesCount] = useState(0);
  const [certsCount, setCertsCount] = useState(0);

  const [latestCourses, setLatestCourses] = useState([]);
  const [latestMessages, setLatestMessages] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [cRes, sRes, bRes, mRes, certRes] = await Promise.all([
          api.get("/admin/courses"),
          api.get("/admin/students"),
          api.get("/admin/blogs"),
          api.get("/admin/messages"),
          api.get("/admin/certificates"),
        ]);

        const courses = Array.isArray(cRes.data) ? cRes.data : [];
        const students = Array.isArray(sRes.data) ? sRes.data : [];
        const blogs = Array.isArray(bRes.data) ? bRes.data : [];
        const msgs = Array.isArray(mRes.data) ? mRes.data : [];
        const certs = Array.isArray(certRes.data) ? certRes.data : [];

        setCoursesCount(courses.length);
        setStudentsCount(students.length);

        // ✅ Blog count fixed (Published / Total)
        const publishedBlogs = blogs.filter((b) => b.published);
        setBlogsCount({
          total: blogs.length,
          published: publishedBlogs.length,
        });

        setMessagesCount(msgs.length);
        setCertsCount(certs.length);

        // previews
        setLatestCourses(courses.slice(0, 4));
        setLatestMessages(msgs.slice(0, 4));
      } catch (err) {
        console.error("Admin dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickActions = useMemo(
    () => [
      { label: "Add Course", to: "/admin/courses/add", tint: "gold" },
      { label: "Manage Lessons", to: "/admin/lessons", tint: "water" },
      { label: "Publish Certificates", to: "/admin/certificates", tint: "fire" },
      { label: "View Messages", to: "/admin/messages", tint: "cold" },
    ],
    []
  );

  if (loading) return <Loader label="Loading admin dashboard..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
      >
        {/* glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" />

        <div className="relative">
          <p className="text-xs tracking-[0.25em] text-white/60">
            ADMIN • OVERVIEW • CONTROL
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
            Admin <span className="text-gold">Dashboard</span>
          </h1>

          <p className="mt-2 text-white/70 max-w-2xl">
            Monitor courses, students, progress, certificates, blogs and messages from one place.
          </p>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {quickActions.map((a) => (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:border-white/25 hover:bg-white/12 transition"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
        <DashboardCard
          title="Courses"
          value={coursesCount}
          icon="📘"
          tint="gold"
          subtitle="Total courses created"
        />
        <DashboardCard
          title="Students"
          value={studentsCount}
          icon="🎓"
          tint="water"
          subtitle="Total enrolled users"
        />

        {/* ✅ FIXED BLOG CARD */}
        <DashboardCard
          title="Blogs"
          value={`${blogsCount.published} / ${blogsCount.total}`}
          icon="📝"
          tint="fire"
          subtitle="Published / Total"
        />

        <DashboardCard
          title="Messages"
          value={messagesCount}
          icon="💬"
          tint="cold"
          subtitle="Contact form submissions"
        />
        <DashboardCard
          title="Certificates"
          value={certsCount}
          icon="🏆"
          tint="gold"
          subtitle="Generated certificates"
        />
      </div>

      {/* Previews */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Latest Courses */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Latest Courses</h2>
            <button
              onClick={() => navigate("/admin/courses")}
              className="text-sm text-gold hover:opacity-80"
            >
              View All →
            </button>
          </div>

          {latestCourses.length === 0 ? (
            <p className="text-white/60 text-sm">No courses created yet.</p>
          ) : (
            <div className="space-y-2">
              {latestCourses.map((c) => (
                <div
                  key={c._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-white/60 truncate">
                      {c.category || "General"} • {c.level || "Beginner"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs px-3 py-1 rounded-full border"
                    style={{
                      borderColor: c.published
                        ? "rgba(0,209,255,0.35)"
                        : "rgba(255,77,46,0.35)",
                      background: c.published
                        ? "rgba(0,209,255,0.10)"
                        : "rgba(255,77,46,0.10)",
                    }}
                  >
                    {c.published ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Messages */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Latest Messages</h2>
            <button
              onClick={() => navigate("/admin/messages")}
              className="text-sm text-gold hover:opacity-80"
            >
              View All →
            </button>
          </div>

          {latestMessages.length === 0 ? (
            <p className="text-white/60 text-sm">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {latestMessages.map((m) => (
                <div
                  key={m._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">
                      {m.subject || "No subject"}
                    </p>
                    <span className="text-xs text-white/50">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 truncate mt-1">
                    {m.email || ""} • {m.name || ""}
                  </p>
                  <p className="text-sm text-white/70 line-clamp-2 mt-2">
                    {m.message || ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}
