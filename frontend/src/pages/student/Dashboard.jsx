import DashboardCard from "../../components/DashboardCard";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  // Later we will connect real data from API
  const studentName = "Student";

  const continueLearning = {
    title: "Full Stack MERN (Beginner → Pro)",
    lesson: "Lesson 06 • JWT Authentication",
    progress: 42,
    eta: "35 min",
    action: "/student/my-courses",
  };

  const recentActivity = [
    { title: "Watched: JWT Authentication", time: "Today • 20 min", badge: "Learning" },
    { title: "Quiz Completed: React Basics", time: "Yesterday", badge: "Assessment" },
    { title: "Certificate Earned: HTML Foundations", time: "2 days ago", badge: "Achievement" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="aurora-line absolute top-0 left-0 right-0" />

        <div className="relative z-10">
          <p className="text-white/60 text-sm">Student Portal</p>

          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold leading-tight">
            Welcome back, <span className="text-gold">{studentName}</span>
          </h1>

          <p className="mt-2 text-white/65 max-w-2xl">
            Track your progress, continue learning, and unlock certificates after completing courses.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn-gold" to="/courses">
              Browse Courses
            </Link>
            <Link className="btn-ghost" to="/student/my-courses">
              My Learning
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <DashboardCard title="My Courses" value="4" icon="📚" tint="gold" subtitle="Enrolled courses" />
        <DashboardCard title="Progress" value="42%" icon="🔥" tint="fire" subtitle="This week growth" />
        <DashboardCard title="Certificates" value="2" icon="🏆" tint="water" subtitle="Unlocked" />
        <DashboardCard title="Profile" value="1" icon="💠" tint="cold" subtitle="Account settings" />
      </div>

      {/* Continue + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid opacity-[0.35]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/60 text-sm">Continue learning</p>
                <h2 className="mt-1 text-2xl font-extrabold">{continueLearning.title}</h2>
                <p className="mt-1 text-white/65">{continueLearning.lesson}</p>
              </div>

              <Link to={continueLearning.action} className="btn-gold">
                Resume →
              </Link>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Overall Progress</span>
                <span className="font-bold text-white">{continueLearning.progress}%</span>
              </div>

              <div className="mt-2 h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${continueLearning.progress}%` }}
                  transition={{ duration: 0.7 }}
                  className="h-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--gold), var(--fire))",
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="badge badge-done">Next: Complete lesson</span>
                <span className="badge">ETA: {continueLearning.eta}</span>
                <span className="badge badge-pending">Goal: Finish module</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 border border-white/10"
        >
          <p className="text-white/60 text-sm">Quick actions</p>
          <h3 className="mt-1 text-xl font-extrabold">Shortcuts</h3>

          <div className="mt-5 space-y-3">
            <QuickLink to="/student/my-courses" title="Open My Courses" desc="Continue enrolled courses" />
            <QuickLink to="/student/progress" title="View Progress" desc="Track completed lessons" />
            <QuickLink to="/student/certificates" title="Certificates" desc="Download PDF certificates" />
            <QuickLink to="/contact" title="Support" desc="Contact admin for help" />
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Tracking</p>
            <h3 className="mt-1 text-xl font-extrabold">Recent Activity</h3>
          </div>
          <span className="badge">Auto (UI)</span>
        </div>

        <div className="mt-5 space-y-3">
          {recentActivity.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-hover rounded-2xl p-4 border border-white/10 bg-white/[0.04] flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-white/60 mt-1">{a.time}</p>
              </div>
              <span className="badge">{a.badge}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function QuickLink({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="glass-hover rounded-2xl p-4 border border-white/10 bg-white/[0.04] block"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <span className="text-white/60">→</span>
      </div>
      <p className="text-sm text-white/60 mt-1">{desc}</p>
    </Link>
  );
}
