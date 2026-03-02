import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function AdminCourseList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/courses");
        setRows(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Admin Course List</h1>
        <Link className="btn-gold" to="/admin/course-editor/new">
          New Course
        </Link>
      </div>
      {loading ? (
        <div className="text-white/60">Loading...</div>
      ) : (
        <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/70 border-b border-white/10">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">State</th>
                <th className="p-3">Lessons Finalized</th>
                <th className="p-3">Quizzes Finalized</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="border-b border-white/5">
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.state || (c.published ? "PUBLISHED" : "DRAFT")}</td>
                  <td className="p-3">{c.lessonsFinalized ? "Yes" : "No"}</td>
                  <td className="p-3">{c.quizzesFinalized ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <Link className="btn-ghost" to={`/admin/course-editor/${c._id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
