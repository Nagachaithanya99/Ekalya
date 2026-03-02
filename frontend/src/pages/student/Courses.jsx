import { useEffect, useState } from "react";
import api from "../../services/api";
import CourseCard from "../../components/CourseCard";
import { motion } from "framer-motion";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
      >
        <div className="aurora-line absolute top-0 left-0 right-0" />
        <div className="relative z-10">
          <p className="text-white/60 text-sm">Learning Library</p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Available <span className="text-gold">Courses</span>
          </h1>
          <p className="mt-2 text-white/65 max-w-2xl">
            Browse all published courses. Enroll, learn at your pace, and earn certificates
            after completion.
          </p>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <Stat label="Total Courses" value={courses.length} />
        <Stat label="Skill Levels" value="Beginner → Advanced" />
        <Stat label="Certificates" value="Available" />
      </motion.div>

      {/* Content */}
      <div className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.25]" />

        <div className="relative z-10">
          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          )}

          {/* Empty */}
          {!loading && courses.length === 0 && (
            <p className="text-white/60 text-center py-10">
              No courses available at the moment.
            </p>
          )}

          {/* Courses Grid */}
          {!loading && courses.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.06,
                  },
                },
              }}
              className="grid gap-6 sm:grid-cols-2 md:grid-cols-3"
            >
              {courses.map((course) => (
                <motion.div
                  key={course._id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function Stat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-4 border border-white/10">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-gold">{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl h-32 bg-white/[0.06] border border-white/10" />
  );
}
