import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiInstagram, FiLinkedin, FiMail } from "react-icons/fi";
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
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.06]">
        <span className="text-white/70 transition group-hover:text-white">{children}</span>
      </span>
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);
  const profileImage = "https://avatars.githubusercontent.com/Nagachaithanya99";

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

      <div className="relative w-full px-6 py-10">
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

            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Learn, track progress, take quizzes, and earn certificates in one smooth
              platform.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <IconBtn href="mailto:chaithanyan917@gmail.com" label="Email">
                <FiMail className="h-5 w-5" />
              </IconBtn>
              <IconBtn href="https://www.instagram.com/nagachaithanya_917/" label="Instagram">
                <FiInstagram className="h-5 w-5" />
              </IconBtn>
              <IconBtn
                href="https://www.linkedin.com/in/naga-chaithanya-51702a386?trk=contact-info"
                label="LinkedIn"
              >
                <FiLinkedin className="h-5 w-5" />
              </IconBtn>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <p className="font-semibold text-white">Quick Links</p>
            <div className="mt-4 grid gap-2">
              {nav.map((l) => {
                const active = pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={[
                      "group flex items-center justify-between rounded-xl border border-white/10 px-4 py-3",
                      "bg-white/[0.03] transition hover:bg-white/[0.06]",
                      active ? "ring-1 ring-[#fbbf24]/40" : "",
                    ].join(" ")}
                  >
                    <span className="text-white/75 transition group-hover:text-white">{l.label}</span>
                    <span className="text-[#fbbf24]/80 transition group-hover:text-[#fbbf24]">
                      -&gt;
                    </span>
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
            <p className="font-semibold text-white">Platform</p>
            <p className="mt-3 text-sm text-white/60">
              Certificates • Quizzes • Progress Tracking • Secure Login
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <img
                src={profileImage}
                alt="NagaChaithanya M"
                className="h-14 w-14 rounded-full border border-white/20 object-cover"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold text-white">Made by NagaChaithanya.M</p>
                <p className="text-xs text-white/60">Developer</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/45">
            © {year} Ekalya Learning Platform. Made by NagaChaithanya.M
          </p>

          <div className="flex items-center gap-4 text-sm">
            <Link className="text-white/45 transition hover:text-white" to="/contact">
              Support
            </Link>
            <span className="text-white/20">•</span>
            <a className="text-white/45 transition hover:text-white" href="#">
              Privacy
            </a>
            <span className="text-white/20">•</span>
            <a className="text-white/45 transition hover:text-white" href="#">
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
          className="fixed bottom-6 left-6 z-50 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white/80 shadow-lg backdrop-blur hover:bg-black/75 hover:text-white"
        >
          Top
        </motion.button>
      )}
    </footer>
  );
}
