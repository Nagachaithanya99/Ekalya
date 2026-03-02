import { NavLink } from "react-router-dom";
import { FiHome, FiBriefcase, FiBookmark, FiMessageSquare, FiUser } from "react-icons/fi";

const items = [
  { to: "/student", label: "Home", icon: FiHome, end: true },
  { to: "/student/jobs", label: "Jobs", icon: FiBriefcase },
  { to: "/student/my-courses", label: "Saved", icon: FiBookmark },
  { to: "/student/certificates", label: "Messages", icon: FiMessageSquare },
  { to: "/student/profile", label: "Profile", icon: FiUser },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07080d]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center rounded-xl text-[11px] transition ${
                  isActive ? "bg-white/12 text-[#f7d774]" : "text-white/65 hover:bg-white/8"
                }`
              }
            >
              <Icon className="text-base" />
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
