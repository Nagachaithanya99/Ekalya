import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import { getAllCoursesAdmin } from "../../services/courseService";

export default function QuizCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAllCoursesAdmin()
      .then((res) => setCourses(res.data || []))
      .catch((e) => {
        console.error(e);
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading courses..." />;

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-extrabold"
      >
        Manage <span className="text-gold">Quizzes</span>
      </motion.h1>

      {courses.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-white/70 border border-white/10">
          No courses found. Create a course first.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c._id}
              className="glass rounded-3xl p-5 border border-white/10"
            >
              <p className="font-extrabold text-lg">{c.title}</p>
              <p className="text-white/60 text-sm mt-1 line-clamp-2">
                {c.subtitle || c.description || "No description"}
              </p>

              <button
                onClick={() => navigate(`/admin/quizzes/${c._id}`)}
                className="btn-gold mt-4"
              >
                Manage Quizzes →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
