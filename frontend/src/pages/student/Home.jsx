import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCourses } from "../../services/enrollmentService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SectionHeader from "../../components/ui/SectionHeader";

export default function Home() {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    getMyCourses()
      .then((res) => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEnrollments([]));
  }, []);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter((e) => Number(e.progressPercent || 0) >= 100).length;
    const inProgress = total - completed;
    return { total, completed, inProgress };
  }, [enrollments]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Student Home"
        subtitle="Your learning and job activity in one responsive workspace."
        right={
          <div className="flex gap-2">
            <Link to="/student/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled" value={stats.total} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Completed" value={stats.completed} />
      </div>

      <Card className="p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold md:text-xl">Recent Courses</h2>
          <Link to="/student/my-courses" className="text-sm text-[#f7d774]">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {enrollments.slice(0, 5).map((e) => (
            <div
              key={e._id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/4 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{e.course?.title || "Course"}</p>
                <p className="text-xs text-white/65">
                  Progress: {Math.round(Number(e.progressPercent || 0))}%
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <Link to={`/student/watch/${e.course?._id || ""}`} className="block w-full sm:w-auto">
                  <Button full variant="ghost">Continue</Button>
                </Link>
              </div>
            </div>
          ))}
          {enrollments.length === 0 ? (
            <p className="text-sm text-white/65">No courses yet. Start with jobs/courses listing.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-bold md:text-xl">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/student/jobs" label="Find Jobs" />
          <QuickLink to="/student/my-courses" label="Saved Jobs/Courses" />
          <QuickLink to="/student/certificates" label="Messages & Certificates" />
          <QuickLink to="/student/profile" label="Profile" />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-white/65">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-extrabold">{value}</p>
        <Badge>{label}</Badge>
      </div>
    </Card>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 px-4 text-sm font-medium hover:bg-white/10"
    >
      {label}
    </Link>
  );
}
