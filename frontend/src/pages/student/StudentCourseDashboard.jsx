import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLessonsByCourse } from "../../services/lessonService";
import api from "../../services/api";
import { getMyCourses } from "../../services/enrollmentService";

export default function StudentCourseDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, lRes, pRes] = await Promise.all([
          api.get(`/courses/${id}`),
          getLessonsByCourse(id),
          getMyCourses().catch(() => ({ data: [] })),
        ]);
        setCourse(cRes.data);
        setLessons(Array.isArray(lRes.data) ? lRes.data : []);
        const enr = (Array.isArray(pRes.data) ? pRes.data : []).find(
          (x) => String(x.course?._id) === String(id)
        );
        setProgress(enr || null);
      } catch (e) {
        console.error("Failed to load student course dashboard:", e);
        setCourse(null);
        setLessons([]);
        setProgress(null);
      }
    })();
  }, [id]);

  const percent = useMemo(() => Number(progress?.progressPercent || 0), [progress]);
  const computedPercent = useMemo(() => {
    const total = lessons.length;
    if (!total) return percent;
    const done = new Set((progress?.completedLessonIds || []).map(String)).size;
    const fromDone = Math.round((done / total) * 100);
    return Math.max(percent, fromDone);
  }, [lessons, progress?.completedLessonIds, percent]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{course?.title || "Course Dashboard"}</h1>
      <div className="glass rounded-2xl border border-white/10 p-4">
        <div className="text-sm text-white/70">Progress: {computedPercent}%</div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#f7d774]" style={{ width: `${computedPercent}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {lessons.map((l) => (
          <button
            key={l._id}
            onClick={() => navigate(`/student/v2/lesson/${id}/${l._id}`)}
            className="w-full text-left glass rounded-xl border border-white/10 p-3"
          >
            {l.order}. {l.title}
          </button>
        ))}
      </div>

      <button className="btn-gold" onClick={() => navigate(`/student/v2/final-quiz/${id}`)}>
        Open Final Quiz
      </button>
    </div>
  );
}
