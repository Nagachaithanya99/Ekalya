import Sidebar from "./Sidebar";

export default function StudentSidebar({ mobileOpen = false, onClose }) {
  const items = [
    {
      id: "student-dashboard",
      to: "/student",
      label: "Dashboard",
      icon: "🏠",
      tint: "gold",
      end: true,
    },
    {
      id: "student-my-courses",
      to: "/student/my-courses",
      label: "My Courses",
      icon: "📘",
      tint: "water",
    },
    {
      id: "student-payments",
      to: "/student/payments",
      label: "Payments",
      icon: "💳",
      tint: "gold",
    },
    {
      id: "student-notifications",
      to: "/student/notifications",
      label: "Notifications",
      icon: "🔔",
      tint: "water",
    },
    {
      id: "student-progress",
      to: "/student/progress",
      label: "Progress",
      icon: "📊",
      tint: "fire",
    },
    {
      id: "student-certificates",
      to: "/student/certificates",
      label: "Certificates",
      icon: "🎓",
      tint: "cold",
    },
    {
      id: "student-profile",
      to: "/student/profile",
      label: "Profile",
      icon: "👤",
      tint: "gold",
    },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-full w-[300px]
        transform transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      <div className="glass flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <p className="font-semibold text-white">Ekalya Student Panel</p>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/15"
        >
          X
        </button>
      </div>

      <div className="h-full">
        <Sidebar title="Student Panel" items={items} fixed={false} onItemClick={onClose} />
      </div>
    </aside>
  );
}
