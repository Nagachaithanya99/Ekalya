import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./common/Logo";

function IconBtn({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="group inline-flex"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition">
        <span className="text-white/70 group-hover:text-white transition">{children}</span>
      </span>
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 350);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: "Home", to: "/" },
    { label: "Courses", to: "/courses" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black/60">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,140,60,0.35), transparent 60%)",
          }}
          animate={{ x: [0, 30, 0], y: [0, 18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(80,200,255,0.25), transparent 60%)",
          }}
          animate={{ x: [0, -28, 0], y: [0, -14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#fbbf24]/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <Logo size="medium" />
            </div>

            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Learn, track progress, take quizzes, and earn certificates in one smooth
              platform.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <IconBtn href="https://github.com/Nagachaithanya99" label="GitHub">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.86 3.16 8.98 7.55 10.43.55.1.75-.24.75-.53v-1.9c-3.07.67-3.72-1.3-3.72-1.3-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.67 1.13 1.67 1.13.98 1.67 2.56 1.19 3.18.9.1-.71.38-1.19.7-1.46-2.45-.28-5.03-1.22-5.03-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.41.11-2.95 0 0 .93-.3 3.05 1.13.88-.24 1.82-.37 2.76-.37.94 0 1.88.13 2.76.37 2.12-1.43 3.05-1.13 3.05-1.13.6 1.54.22 2.67.11 2.95.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.04 5.42.39.34.74 1.02.74 2.06v3.05c0 .29.2.64.76.53 4.38-1.45 7.54-5.57 7.54-10.43C23.25 5.48 18.27.5 12 .5z" />
                </svg>
              </IconBtn>
              <IconBtn href="https://www.linkedin.com/in/naga-chaithanya-51702a386/" label="LinkedIn">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.35V9h3.42v1.56h.05c.48-.9 1.65-1.85 3.4-1.85 3.64 0 4.31 2.4 4.31 5.52v6.22zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
              </IconBtn>
              <IconBtn href="mailto:nchaithanya313@gmail.com" label="Email">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
                </svg>
              </IconBtn>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <p className="text-white font-semibold">Quick Links</p>
            <div className="mt-4 grid gap-2">
              {nav.map((l) => {
                const active = pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={[
                      "group flex items-center justify-between rounded-xl border border-white/10 px-4 py-3",
                      "bg-white/[0.03] hover:bg-white/[0.06] transition",
                      active ? "ring-1 ring-[#fbbf24]/40" : "",
                    ].join(" ")}
                  >
                    <span className="text-white/75 group-hover:text-white transition">{l.label}</span>
                    <span className="text-[#fbbf24]/80 group-hover:text-[#fbbf24] transition">→</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-white font-semibold">Platform</p>
            <p className="mt-3 text-white/60 text-sm">
              Certificates • Quizzes • Progress Tracking • Secure Login
            </p>
          </motion.div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-white/45 text-sm">
            © {year} Ekalya Learning Platform. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <Link className="text-white/45 hover:text-white transition" to="/contact">
              Support
            </Link>
            <span className="text-white/20">•</span>
            <a className="text-white/45 hover:text-white transition" href="#">
              Privacy
            </a>
            <span className="text-white/20">•</span>
            <a className="text-white/45 hover:text-white transition" href="#">
              Terms
            </a>
          </div>
        </div>
      </div>

      {showTop && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-50 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white/80 hover:text-white hover:bg-black/75 shadow-lg backdrop-blur"
        >
          ↑ Top
        </motion.button>
      )}
    </footer>
  );
}
