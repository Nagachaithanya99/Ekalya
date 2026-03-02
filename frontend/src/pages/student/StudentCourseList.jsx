import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedCourses, enrollCourseFlow } from "../../services/courseLifecycleService";

export default function StudentCourseList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getPublishedCourses().then((r) => setRows(Array.isArray(r.data) ? r.data : []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">StudentCourseList</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((c) => (
          <div key={c._id} className="glass rounded-2xl border border-white/10 p-4 space-y-2">
            <h2 className="font-bold text-lg">{c.title}</h2>
            <p className="text-white/65 text-sm">{c.description}</p>
            <div className="flex gap-2">
              <button className="btn-gold" onClick={() => enrollCourseFlow(c._id)}>
                Enroll
              </button>
              <Link to={`/student/v2/courses/${c._id}`} className="btn-ghost">
                Open Dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
