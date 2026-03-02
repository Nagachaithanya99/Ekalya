import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";

import { getCourseById } from "../../services/courseService";
import { enrollCourse } from "../../services/enrollmentService";
import Loader from "../../components/Loader";

import {
  FiArrowLeft,
  FiClock,
  FiGlobe,
  FiBarChart2,
  FiAward,
  FiPlayCircle,
} from "react-icons/fi";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1400&auto=format&fit=crop";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getCourseById(id);
        setCourse(res.data || null);
      } catch (e) {
        console.error(e);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const info = useMemo(() => {
    if (!course) return null;

    const title = course.title || "Untitled Course";
    const subtitle = course.subtitle || course.category || "Professional Course";
    const level = course.level || "Beginner";
    const lang = course.language || "English";
    const category = course.category || "General";
    const price = Number(course.price || 0);

    const durationText =
      course.duration ||
      (course.durationHours ? `${course.durationHours} hrs` : null) ||
      "Self-paced";

    const outcomes =
      course.outcomes ||
      course.whatYouWillLearn ||
      [
        "Understand core concepts with step-by-step lessons",
        "Build real mini-projects while learning",
        "Track progress and resume anytime",
        "Complete the course to unlock certificate",
      ];

    const requirements =
      course.requirements || [
        "Basic computer knowledge",
        "Internet connection",
        "Interest to learn and practice",
      ];

    const includes =
      course.includes || [
        "Video lessons + learning materials",
        "Progress tracking",
        "Certificate after completion",
        "Lifetime access (project feature)",
      ];

    const syllabus =
      course.syllabus ||
      [
        {
          title: "Introduction & Setup",
          items: ["Course overview", "Tools required", "Project roadmap"],
        },
        {
          title: "Core Concepts",
          items: ["Key fundamentals", "Hands-on examples", "Common mistakes"],
        },
        {
          title: "Build a Mini Project",
          items: ["Implement features", "Test & debug", "Deployment basics"],
        },
        {
          title: "Final Assessment",
          items: ["Course completion", "Certificate process", "Next steps"],
        },
      ];

    return {
      title,
      subtitle,
      level,
      lang,
      category,
      price,
      durationText,
      outcomes,
      requirements,
      includes,
      syllabus,
    };
  }, [course]);

  // ✅ NEW ENROLL LOGIC
  const handleEnroll = async () => {
    if (!course?._id) return;

    // login required
    if (!isSignedIn) {
      navigate("/login");
      return;
    }

    // paid course -> UPI payment page
    if (Number(course.price || 0) > 0) {
      navigate(`/student/pay/${course._id}`);
      return;
    }

    // free course -> enroll directly
    try {
      setEnrolling(true);
      await enrollCourse(course._id);
      navigate("/student/my-courses");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Enroll failed");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Loader label="Loading course..." />;
  if (!course || !info)
    return <div className="text-white/70">Course not found</div>;

  const isPaid = info.price > 0;

  return (
    <div className="space-y-8">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl glass">
        <div className="relative">
          <img
            src={course.bannerUrl || course.thumbnailUrl || FALLBACK_BANNER}
            alt={info.title}
            className="h-[420px] w-full object-cover opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 20% 15%, rgba(247,215,116,0.16), transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 80% 30%, rgba(255,77,46,0.12), transparent 50%)",
            }}
          />

          <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/courses")}
              className="btn-ghost !py-2 inline-flex items-center gap-2"
            >
              <FiArrowLeft />
              Back
            </button>

            <div className="hidden sm:flex gap-2">
              <span className="badge">{info.category}</span>
              <span className="badge">Public Course</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <motion.h1
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-extrabold leading-tight"
            >
              {info.title}
            </motion.h1>

            <p className="text-white/75 mt-3 text-sm md:text-base leading-relaxed max-w-3xl">
              {info.subtitle}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
              <Meta icon={<FiBarChart2 />} label={info.level} />
              <Meta icon={<FiGlobe />} label={info.lang} />
              <Meta icon={<FiClock />} label={info.durationText} />
              <Meta icon={<FiAward />} label="Certificate Included" />
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 flex flex-wrap gap-3">
          <Chip label="Price" value={isPaid ? `₹${info.price}` : "Free"} highlight />
          <Chip label="Duration" value={info.durationText} />
          <Chip label="Level" value={info.level} />
          <Chip label="Language" value={info.lang} />
          <Chip label="Certificate" value="After completion" />
        </div>
      </section>

      {/* ================= Main Grid ================= */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="glass rounded-3xl p-6"
          >
            <h2 className="text-xl font-bold">About this course</h2>
            <p className="mt-3 text-white/75 leading-relaxed">
              {course.description || "No description added yet."}
            </p>
          </motion.div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold">
              What you’ll <span className="text-gold">learn</span>
            </h2>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {info.outcomes.map((x, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="rounded-2xl p-4 bg-white/5 border border-white/10 glass-hover"
                >
                  <p className="text-sm text-white/85 leading-relaxed">✅ {x}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Course content</h2>
              <span className="text-xs text-white/55">Preview</span>
            </div>

            <div className="mt-4 space-y-3">
              {info.syllabus.map((sec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4"
                >
                  <p className="font-semibold">{sec.title}</p>
                  <ul className="mt-2 text-sm text-white/70 space-y-1">
                    {sec.items.map((it, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <FiPlayCircle className="opacity-70" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold">Requirements</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/75 leading-relaxed">
                {info.requirements.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold">This course includes</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/75 leading-relaxed">
                {info.includes.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-bold">🎓 Certificate after completion</h3>
            <p className="mt-2 text-white/75 text-sm leading-relaxed">
              Complete the course 100%. After verification, the admin publishes your
              certificate. You can download it from the Student → Certificates page.
            </p>
          </div>

          <button onClick={() => navigate("/courses")} className="btn-ghost">
            ← Back to Courses
          </button>
        </div>

        {/* Right sticky */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="glass rounded-3xl p-6">
            <p className="text-xs text-white/60">Course Access</p>

            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-2xl font-extrabold">
                <span className="text-gold">{isPaid ? `₹${info.price}` : "Free"}</span>
              </p>
              <span className="badge badge-done">Published</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
              <SmallPill text="Progress tracking" />
              <SmallPill text="Self-paced" />
              <SmallPill text="Video + PDF" />
              <SmallPill text="Certificate" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnroll}
              disabled={enrolling}
              className="mt-5 w-full px-5 py-3 rounded-xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60"
            >
              {enrolling
                ? "Processing..."
                : isPaid
                ? "Pay & Enroll"
                : "Enroll Now"}
            </motion.button>

            <button
              onClick={() => navigate("/contact")}
              className="mt-3 w-full btn-ghost"
            >
              Need help? Contact
            </button>

            <div className="mt-4 aurora-line rounded-full" />

            <p className="mt-3 text-xs text-white/55 leading-relaxed">
              {isPaid ? (
                <>
                  Pay securely via Razorpay for instant enrollment, or use UPI app/QR
                  and submit proof for admin approval.
                </>
              ) : (
                <>
                  After enrollment, go to{" "}
                  <span className="text-gold">Student → My Courses</span> to start
                  learning.
                </>
              )}
            </p>
          </div>

          <div className="glass rounded-3xl p-6">
            <h4 className="font-bold">What happens next?</h4>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              You’ll get access to lessons inside your dashboard, your progress will auto-save,
              and after completion you can download your certificate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small UI ---------------- */

function Chip({ label, value, highlight }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-[11px] text-white/60">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-gold" : "text-white/85"}`}>
        {value}
      </p>
    </div>
  );
}

function Meta({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
      <span className="text-white/70">{icon}</span>
      <span className="text-white/70 text-sm">{label}</span>
    </div>
  );
}

function SmallPill({ text }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
      {text}
    </div>
  );
}
