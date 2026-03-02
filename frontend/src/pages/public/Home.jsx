// ✅ FILE: frontend/src/pages/public/Home.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { getPublicCourses } from "../../services/courseService";
import CourseCard from "../../components/CourseCard";
import { useNavigate } from "react-router-dom";

/**
 * ✅ Put your assets here:
 * frontend/public/slides/hero-1.mp4
 * frontend/public/slides/hero-2.mp4
 * frontend/public/slides/hero-3.mp4
 */
const SLIDES = [
  {
    eyebrow: "Online Course Platform",
    title: "Learn skills that get you hired.",
    highlight: "Faster.",
    desc: "Browse admin-curated courses, track progress lesson by lesson, and unlock certificates after completion.",
    cta1: { label: "Browse Courses", to: "/courses" },
    cta2: { label: "Read Blog", to: "/blog" },
    bgVideo: "/slides/hero-1.mp4",
    tint: "gold",
  },
  {
    eyebrow: "Track Progress",
    title: "Continue from where you stopped.",
    highlight: "Anytime.",
    desc: "Video progress is saved. Close the lesson and resume later without losing your place.",
    cta1: { label: "My Courses", to: "/student/my-courses" },
    cta2: { label: "Contact", to: "/contact" },
    bgVideo: "/slides/hero-2.mp4",
    tint: "water",
  },
  {
    eyebrow: "Certificates",
    title: "Complete a course and earn a",
    highlight: "Certificate.",
    desc: "After you finish 100%, admin publishes your certificate and you can download it anytime.",
    cta1: { label: "View Certificates", to: "/student/certificates" },
    cta2: { label: "How it Works", to: "#how" },
    bgVideo: "/slides/hero-3.mp4",
    tint: "fire",
  },
];

// ✅ theme map (auto tint per slide)
const TINT = {
  gold: {
    accent: "rgba(255,197,84,0.95)",
    accentSoft: "rgba(255,197,84,0.20)",
    glow: "rgba(255,197,84,0.28)",
  },
  fire: {
    accent: "rgba(255,105,45,0.95)",
    accentSoft: "rgba(255,105,45,0.18)",
    glow: "rgba(255,105,45,0.26)",
  },
  water: {
    accent: "rgba(54,210,255,0.92)",
    accentSoft: "rgba(54,210,255,0.18)",
    glow: "rgba(54,210,255,0.24)",
  },
};

export default function Home() {
  const navigate = useNavigate();

  // slideshow
  const [index, setIndex] = useState(0);
  const pauseRef = useRef(false);
  const progressRef = useRef(0);
  const rafRef = useRef(null);

  // courses
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [homeCourses, setHomeCourses] = useState([]);

  const slide = SLIDES[index];
  const theme = TINT[slide.tint] || TINT.gold;

  // parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 140, damping: 18, mass: 0.35 });
  const sy = useSpring(my, { stiffness: 140, damping: 18, mass: 0.35 });

  const onHeroMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    mx.set((px - 0.5) * 18); // -9..9
    my.set((py - 0.5) * 18);
  };

  const onHeroLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const go = useCallback(
    (to) => {
      if (!to) return;
      if (to.startsWith("#")) {
        const el = document.querySelector(to);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      navigate(to);
    },
    [navigate]
  );

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  // ✅ autoplay + smooth progress
  useEffect(() => {
    const DURATION = 5200;
    let start = performance.now();

    const tick = (now) => {
      if (!pauseRef.current) {
        const elapsed = now - start;
        progressRef.current = Math.min(elapsed / DURATION, 1);

        if (elapsed >= DURATION) {
          start = performance.now();
          progressRef.current = 0;
          next();
        }
      } else {
        start = performance.now() - progressRef.current * DURATION;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [next]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // courses load
  useEffect(() => {
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await getPublicCourses();
        const list = Array.isArray(res?.data) ? res.data : [];

        const featuredOnly = list
          .filter((c) => c?.featured)
          .sort((a, b) => {
            const oa = Number(a.featuredOrder || 0);
            const ob = Number(b.featuredOrder || 0);
            if (ob !== oa) return ob - oa;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

        const latest = [...list].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        const pick = featuredOnly.length ? featuredOnly : latest;
        setHomeCourses(pick.slice(0, 6));
      } catch (e) {
        console.error(e);
        setHomeCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  const stats = useMemo(
    () => [
      { k: "Published Courses", v: homeCourses.length ? `${homeCourses.length}+` : "10+" },
      { k: "Progress Tracking", v: "Auto Save" },
      { k: "Certificates", v: "Downloadable" },
      { k: "Roles", v: "Public • Student • Admin" },
    ],
    [homeCourses.length]
  );

  const featuredMode = useMemo(() => homeCourses.some((c) => c?.featured), [homeCourses]);

  const tintGradient = useMemo(() => {
    return `radial-gradient(circle at 25% 20%, ${theme.accentSoft}, transparent 55%)`;
  }, [theme]);

  const highlightGradient = useMemo(() => {
    if (slide.tint === "gold")
      return "linear-gradient(90deg, rgba(255,197,84,1), rgba(255,105,45,1), rgba(255,255,255,0.9), rgba(54,210,255,1))";
    if (slide.tint === "fire")
      return "linear-gradient(90deg, rgba(255,105,45,1), rgba(255,197,84,1), rgba(255,255,255,0.9), rgba(255,105,45,1))";
    return "linear-gradient(90deg, rgba(54,210,255,1), rgba(255,255,255,0.9), rgba(255,197,84,1), rgba(54,210,255,1))";
  }, [slide.tint]);

  return (
    <div className="space-y-14">
      <div className="home-glass-page space-y-14">
        {/* ================= HERO / APPLE-LIKE SLIDES ================= */}
        <section
          className="relative overflow-hidden rounded-3xl border border-white/10"
          onMouseEnter={() => (pauseRef.current = true)}
          onMouseMove={onHeroMove}
          onMouseLeave={() => {
            pauseRef.current = false;
            onHeroLeave(); // ✅ reset parallax here (replaces onMouseLeaveCapture)
          }}
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              style={{ transform: "translateZ(0)" }}
            >
              <motion.video
                key={slide.bgVideo}
                src={slide.bgVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  x: sx,
                  y: sy,
                  scale: 1.06,
                  filter: "saturate(1.08) contrast(1.06) brightness(0.95)",
                }}
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 56%, rgba(0,0,0,0.55) 100%)",
                }}
              />
              <div className="absolute inset-0" style={{ background: tintGradient }} />
              <div className="absolute inset-0 hero-noise" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 w-full px-6 md:px-10 py-10">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
              <div className="min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      className="glass-card p-6 md:p-7 rounded-3xl border border-white/10"
                      style={{
                        boxShadow: `0 0 40px rgba(0,0,0,0.35), 0 0 42px ${theme.glow}`,
                      }}
                    >
                      <p className="text-xs md:text-sm tracking-wider uppercase text-white/70">
                        {slide.eyebrow}
                      </p>

                      <h1 className="mt-3 text-4xl md:text-6xl font-extrabold leading-[1.05]">
                        <span
                          className="text-white/95"
                          style={{ textShadow: "0 8px 22px rgba(0,0,0,0.55)" }}
                        >
                          {slide.title}{" "}
                        </span>

                        <span
                          className="shiny-text text-transparent bg-clip-text"
                          style={{
                            backgroundImage: highlightGradient,
                            textShadow: "0 10px 28px rgba(0,0,0,0.55)",
                          }}
                        >
                          {slide.highlight}
                        </span>
                      </h1>

                      <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-white/75">
                        {slide.desc}
                      </p>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          className="px-5 py-3 rounded-2xl font-semibold text-black transition"
                          style={{
                            background: theme.accent,
                            boxShadow: `0 0 26px ${theme.glow}`,
                          }}
                          onClick={() => go(slide.cta1.to)}
                        >
                          {slide.cta1.label}
                        </button>

                        <button className="btn-glass" onClick={() => go(slide.cta2.to)}>
                          {slide.cta2.label}
                        </button>
                      </div>

                      <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniPill text="Clerk Secure Login" />
                        <MiniPill text="Cloudinary Uploads" />
                        <MiniPill text="Auto Progress Save" />
                        <MiniPill text="Certificates" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex items-center gap-3">
                  <button className="btn-glass !px-4 !py-2" onClick={prev}>
                    ←
                  </button>

                  <div className="flex items-center gap-2">
                    {SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          i === index ? "w-10" : "w-2.5 hover:w-4"
                        }`}
                        style={{
                          background: i === index ? theme.accent : "rgba(255,255,255,0.22)",
                        }}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button className="btn-glass !px-4 !py-2" onClick={next}>
                    →
                  </button>
                </div>

                <ProgressBar getProgress={() => progressRef.current} accent={theme.accent} />

                <motion.div
                  className="mt-5 flex items-center gap-2 text-sm text-white/65"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <motion.span
                    className="inline-block h-6 w-4 rounded-full border border-white/20 relative"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/50" />
                  </motion.span>
                  <span>Scroll to see courses</span>
                </motion.div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((s) => (
                    <div
                      key={s.k}
                      className="glass-card rounded-2xl p-4 border border-white/10 hover:border-white/20 transition"
                      style={{ boxShadow: `0 0 30px rgba(0,0,0,0.25)` }}
                    >
                      <p className="text-xs text-white/70">{s.k}</p>
                      <p className="text-xl font-bold mt-1 text-white/90">{s.v}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-white/20 transition">
                  <p className="font-semibold text-white/90">✅ What you can do here</p>
                  <ul className="mt-3 text-sm text-white/75 space-y-2 leading-relaxed">
                    <li>• Browse and enroll in courses</li>
                    <li>• Watch lessons (video + PDF)</li>
                    <li>• Auto progress tracking + resume</li>
                    <li>• Download certificates after completion</li>
                  </ul>

                  <div
                    className="mt-4 h-[3px] rounded-full"
                    style={{ background: theme.accent, opacity: 0.55 }}
                  />
                  <p className="mt-3 text-xs text-white/65">
                    Tip: Use <span style={{ color: theme.accent }}>← →</span> keys to switch slides.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COURSES ================= */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                {featuredMode ? (
                  <>
                    Featured <span style={{ color: theme.accent }}>Courses</span>
                  </>
                ) : (
                  <>
                    Latest <span style={{ color: theme.accent }}>Courses</span>
                  </>
                )}
              </h2>
              <p className="text-white/60 text-sm md:text-base">
                {featuredMode
                  ? "Courses picked by admin to appear on the Home page."
                  : "No featured courses yet — showing latest published courses."}
              </p>
            </div>

            <button className="btn-glass" onClick={() => navigate("/courses")}>
              View All
            </button>
          </div>

          {loadingCourses ? (
            <div className="glass-card rounded-2xl p-6 text-white/70 border border-white/10">
              Loading courses…
            </div>
          ) : homeCourses.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-white/70 border border-white/10">
              No published courses yet. Ask admin to publish courses.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeCourses.map((c, idx) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                >
                  <CourseCard course={c} tint={slide.tint} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how" className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white/90">
            How it <span style={{ color: theme.accent }}>Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <StepCard n="01" title="Browse Courses" desc="Explore admin-created courses and choose what you want to learn." />
            <StepCard n="02" title="Enroll & Learn" desc="Watch lessons with video + PDFs. Your progress saves automatically." />
            <StepCard n="03" title="Finish & Get Certified" desc="Complete 100%. Admin publishes your certificate and you download it." />
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white/90">
            Why this platform is <span style={{ color: theme.accent }}>better</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <FeatureCard title="Role-Based Dashboards" desc="Public, Student, and Admin dashboards are separated for security and clarity." />
            <FeatureCard title="Secure Login with Clerk" desc="Authentication and session security handled by Clerk." />
            <FeatureCard title="Cloudinary Uploads" desc="Admin uploads videos/PDFs easily using Cloudinary storage." />
            <FeatureCard title="Progress & Resume" desc="Continue lessons from where you stopped. Track course progress in real-time." />
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="glass-card rounded-3xl p-7 md:p-12 text-center space-y-5 border border-white/10">
          <h3 className="text-2xl md:text-4xl font-extrabold leading-tight text-white/90">
            Start learning today with{" "}
            <span className="shiny-text text-transparent bg-clip-text" style={{ backgroundImage: highlightGradient }}>
              real progress
            </span>
          </h3>
          <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Learn step-by-step, track completion, and unlock certificates after finishing courses.
          </p>

          <div className="flex justify-center gap-3 flex-wrap">
            <button
              className="px-5 py-3 rounded-2xl font-semibold text-black transition"
              style={{ background: theme.accent, boxShadow: `0 0 26px ${theme.glow}` }}
              onClick={() => navigate("/courses")}
            >
              Explore Courses
            </button>
            <button className="btn-glass" onClick={() => navigate("/contact")}>
              Contact Admin
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function MiniPill({ text }) {
  return <div className="mini-pill">{text}</div>;
}

function StepCard({ n, title, desc }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-white/20 transition">
      <p className="text-xs text-white/60 tracking-wider">{n}</p>
      <p className="mt-1 font-semibold text-lg text-white/90">{title}</p>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-white/20 transition">
      <p className="font-semibold text-white/90">{title}</p>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</p>
    </div>
  );
}

function ProgressBar({ getProgress, accent }) {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setP(getProgress());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress]);

  return (
    <div className="mt-3 h-[3px] w-full max-w-[420px] rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.round(p * 100)}%`, background: accent }} />
    </div>
  );
}
