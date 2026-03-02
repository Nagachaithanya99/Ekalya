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
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 glass">
        <p className="font-semibold text-white">Ekalya Student Panel</p>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition grid place-items-center"
        >
          ×
        </button>
      </div>

      <div className="h-full">
        <Sidebar
          title="Student Panel"
          items={items}
          fixed={false}
          onItemClick={onClose}
        />
      </div>
    </aside>
  );
}
