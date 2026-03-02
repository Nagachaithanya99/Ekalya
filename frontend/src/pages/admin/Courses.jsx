import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import CourseCard from "../../components/CourseCard";
import {
  getAllCoursesAdmin,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  featureCourse,
  unfeatureCourse,
} from "../../services/courseService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const navigate = useNavigate();
  const { getToken } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await getAllCoursesAdmin(token);

      const list = Array.isArray(res?.data) ? res.data : [];

      // ✅ sort: featured first, then createdAt
      const sorted = [...list].sort((a, b) => {
        if (!!b.featured !== !!a.featured)
          return Number(b.featured) - Number(a.featured);
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });

      setCourses(sorted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (course) => {
    const ok = confirm(`Delete course: ${course.title}?`);
    if (!ok) return;

    try {
      setBusyId(course._id);
      const token = await getToken();
      await deleteCourse(course._id, token);
      await load();
    } catch {
      alert("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleEdit = (course) => {
    navigate(`/admin/courses/${course._id}/edit`);
  };

  const handlePublishToggle = async (course) => {
    const canPublish =
      !!course?.lessonsFinalized && !!course?.quizzesFinalized && !!course?.finalQuizId;

    if (!course?.published && !canPublish) {
      alert(
        "Please finalize lessons and quizzes first, then publish the course."
      );
      return;
    }

    try {
      setBusyId(course._id);
      if (course.published) await unpublishCourse(course._id);
      else await publishCourse(course._id);
      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Publish toggle failed";
      alert(message);
    } finally {
      setBusyId(null);
    }
  };

  // ✅ NEW: Featured toggle
  const handleFeaturedToggle = async (course) => {
    try {
      setBusyId(course._id);
      const token = await getToken();

      if (!course.published) {
        alert("Publish the course first, then feature it on Home.");
        return;
      }

      if (course.featured) {
        await unfeatureCourse(course._id, token);
      } else {
        await featureCourse(course._id, token, 0);
      }

      await load();
    } catch {
      alert("Featured toggle failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader label="Loading admin courses..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">
          Manage <span className="text-gold">Courses</span>
        </h1>
        <p className="text-white/70 text-sm mt-1">
          Publish/unpublish, feature for Home, edit, and delete courses.
        </p>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-white/60">Total</p>
            <p className="text-xl font-extrabold">{courses.length}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-white/60">Published</p>
            <p className="text-xl font-extrabold">
              {courses.filter((c) => c.published).length}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-white/60">Featured on Home</p>
            <p className="text-xl font-extrabold">
              {courses.filter((c) => c.featured).length}
            </p>
          </div>
        </div>
      </motion.div>

      {courses.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-white/70">
          No courses yet. Add one from “Add Course”.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c._id}
              className={busyId === c._id ? "opacity-70 pointer-events-none" : ""}
            >
              {/* CourseCard already shows Featured badge if course.featured exists */}
              <CourseCard
                course={c}
                admin
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPublishToggle={handlePublishToggle}
              />

              {/* ✅ Feature button under each card */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleFeaturedToggle(c)}
                  className={`btn-ghost w-full ${
                    c.featured ? "active-glow border-[rgba(247,215,116,0.22)]" : ""
                  }`}
                >
                  {c.featured ? "★ Featured on Home" : "☆ Add to Home (Featured)"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
