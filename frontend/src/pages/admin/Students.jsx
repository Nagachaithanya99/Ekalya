import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [activeStudent, setActiveStudent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/students-directory");
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const text = `${r.name} ${r.email}`.toLowerCase();
      return text.includes(q);
    });
  }, [rows, query]);

  if (loading) return <Loader label="Loading students..." />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-white/10">
        <p className="text-xs tracking-[0.25em] text-white/60">
          ADMIN • STUDENTS • DIRECTORY
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold">
          Students <span className="text-gold">Table</span>
        </h1>
        <p className="mt-2 text-white/70">
          View student profiles and their enrolled courses.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or email"
            className="w-full md:max-w-md px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[#f7d774]/40"
          />
          <p className="text-sm text-white/60">
            Total Students:{" "}
            <span className="text-white font-semibold">{filtered.length}</span>
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px]">
            <thead className="bg-black/40">
              <tr className="text-left text-sm text-white/70">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={5}>
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s._id}
                    className="border-t border-white/10 text-sm text-white/85"
                  >
                    <td className="px-4 py-3 font-semibold">{s.name}</td>
                    <td className="px-4 py-3">{s.email || "-"}</td>
                    <td className="px-4 py-3">{s.totalCourses || 0}</td>
                    <td className="px-4 py-3">{s.completedCourses || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setActiveStudent(s)}
                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeStudent && (
        <ProfileDrawer
          student={activeStudent}
          onClose={() => setActiveStudent(null)}
        />
      )}
    </div>
  );
}

function ProfileDrawer({ student, onClose }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/65"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed top-0 right-0 z-[1010] h-screen w-full max-w-xl bg-[#090909] border-l border-white/10 shadow-2xl">
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-white/60">PROFILE</p>
              <h2 className="text-xl font-extrabold mt-1 text-white">
                {student.name}
              </h2>
              <p className="text-sm text-white/70">{student.email || "-"}</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xl"
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60">Total Courses</p>
                <p className="mt-1 text-2xl font-extrabold text-gold">
                  {student.totalCourses || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60">Completed Courses</p>
                <p className="mt-1 text-2xl font-extrabold text-green-400">
                  {student.completedCourses || 0}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-bold text-white">Enrolled Courses</h3>
              {!student.courses?.length ? (
                <p className="mt-2 text-sm text-white/60">
                  This student has not enrolled in any course yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {student.courses.map((c) => (
                    <div
                      key={c.enrollmentId}
                      className="rounded-xl border border-white/10 bg-black/35 p-3"
                    >
                      <p className="font-semibold text-white">{c.courseTitle}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {c.category} • {c.level}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-white/75">
                          Progress: {c.progressPercent || 0}%
                        </span>
                        <span
                          className={
                            c.completed ? "text-green-400" : "text-yellow-300"
                          }
                        >
                          {c.completed ? "Completed" : "In Progress"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
