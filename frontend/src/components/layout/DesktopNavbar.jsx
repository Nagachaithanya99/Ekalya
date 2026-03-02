import { Link, NavLink } from "react-router-dom";
import { FiBell, FiSearch } from "react-icons/fi";
import { UserButton } from "@clerk/clerk-react";
import Logo from "../common/Logo";

export default function DesktopNavbar() {
  const items = [
    { to: "/student", label: "Home", end: true },
    { to: "/student/jobs", label: "Jobs" },
    { to: "/student/my-courses", label: "Saved" },
    { to: "/student/certificates", label: "Messages" },
    { to: "/student/profile", label: "Profile" },
  ];

  return (
    <div className="hidden md:flex h-16 items-center justify-between gap-4">
      <div className="flex items-center gap-8 min-w-0">
        <Link to="/student" className="flex items-center gap-2 min-w-0">
          <Logo size="medium" />
        </Link>
        <nav className="flex items-center gap-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/75 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2">
          <FiSearch className="text-white/60" />
          <input
            className="w-52 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
            placeholder="Search jobs..."
          />
        </div>
        <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/12 bg-white/6 text-white/80 hover:bg-white/10">
          <FiBell />
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}
