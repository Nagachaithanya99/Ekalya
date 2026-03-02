import { Link, NavLink, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import useRole from "../hooks/useRole";
import useTheme from "../hooks/useTheme";

import {
  FiHome,
  FiBookOpen,
  FiEdit3,
  FiMail,
  FiGrid,
  FiMenu,
} from "react-icons/fi";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import Logo from "./common/Logo";

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { role, loading } = useRole();
  const [open, setOpen] = useState(false);

  // ✅ theme
  const { theme, toggleTheme } = useTheme();

  const goDashboard = () => {
    if (loading || !role) {
      navigate("/redirect");
      return;
    }
    navigate(role === "admin" ? "/admin" : "/student");
    setOpen(false);
  };

  const navItems = useMemo(
    () => [
      { to: "/", label: "Home", icon: <FiHome /> },
      { to: "/courses", label: "Courses", icon: <FiBookOpen /> },
      { to: "/blog", label: "Blog", icon: <FiEdit3 /> },
      { to: "/contact", label: "Contact", icon: <FiMail /> },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-50">
      <div className="glass bg-grid border-b border-white/10">
        <div className="aurora-line" />

        <div className="flex h-[74px] w-full items-center justify-between px-5">
          {/* Left */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden h-10 w-10 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 transition grid place-items-center"
                aria-label="Open sidebar"
              >
                <FiMenu />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3">
              <Logo size="medium" />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((it) => (
              <DesktopNavItem key={it.to} to={it.to} label={it.label} />
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* ✅ Theme Toggle (dark <-> midnight dark) */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 transition grid place-items-center"
              title={theme === "dark" ? "Switch to Midnight theme" : "Switch to Default dark theme"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <HiOutlineMoon /> : <HiOutlineSun />}
            </button>

            {/* Mobile top menu */}
            <button
              onClick={() => setOpen((s) => !s)}
              className="md:hidden h-10 w-10 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 transition grid place-items-center"
              aria-label="Open menu"
            >
              ☰
            </button>

            <SignedOut>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:border-white/25 hover:bg-white/15 transition"
              >
                Login
              </motion.button>
            </SignedOut>

            <SignedIn>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={goDashboard}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-black font-extrabold shadow-[0_10px_30px_rgba(247,215,116,0.15)] inline-flex items-center gap-2"
              >
                <FiGrid />
                Dashboard
              </motion.button>

              <div className="hidden sm:block">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-white/10"
            >
              <div className="px-5 py-4 space-y-2">
                {navItems.map((it) => (
                  <MobileNavItem
                    key={it.to}
                    to={it.to}
                    label={it.label}
                    icon={it.icon}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

/* ---------- Helpers ---------- */

function DesktopNavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `px-4 py-2 rounded-2xl border transition ${
          isActive
            ? "bg-white/10 border-[rgba(247,215,116,0.25)] active-glow"
            : "border-transparent text-white/75 hover:bg-white/5 hover:border-white/10"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function MobileNavItem({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl px-4 py-3 border bg-white/5 border-white/10 hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      →
    </NavLink>
  );
}
