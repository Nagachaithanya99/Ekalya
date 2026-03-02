import Sidebar from "./Sidebar";

export default function AdminSidebar() {
  const items = [
    {
      id: "admin-dashboard",
      to: "/admin",
      label: "Dashboard",
      icon: "🏠",
      tint: "gold",
      end: true,
    },
    { id: "admin-courses", to: "/admin/courses", label: "Courses", icon: "📘", tint: "water" },
    { id: "admin-add-course", to: "/admin/courses/add", label: "Add Course", icon: "➕", tint: "fire" },
    { id: "admin-lessons", to: "/admin/lessons", label: "Lessons", icon: "🎥", tint: "water" },
    { id: "admin-quizzes", to: "/admin/quizzes", label: "Quizzes", icon: "🧠", tint: "gold" },
    { id: "admin-students", to: "/admin/students", label: "Students", icon: "🎓", tint: "cold" },
    { id: "admin-blogs", to: "/admin/blogs", label: "Blogs", icon: "📝", tint: "fire" },
    { id: "admin-certs", to: "/admin/certificates", label: "Certificates", icon: "🏆", tint: "gold" },
    { id: "admin-pay-requests", to: "/admin/payments", label: "Payment Requests", icon: "🧾", tint: "gold" },
    { id: "admin-payments-table", to: "/admin/payments-table", label: "Razorpay Payments", icon: "💳", tint: "water" },
    { id: "admin-messages", to: "/admin/messages", label: "Messages", icon: "💬", tint: "water" },
    { id: "admin-notifications", to: "/admin/notifications", label: "Notifications", icon: "🔔", tint: "gold" },
  ];

  return (
    <Sidebar title="Ekalya Admin Panel" items={items} fixed={true} topOffset={72} width={300} />
  );
}
