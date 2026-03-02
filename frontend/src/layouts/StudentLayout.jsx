import { useState } from "react";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import { Outlet, useLocation } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import { motion } from "framer-motion";
import Footer from "../components/Footer";

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-blackRich text-white app-bg relative">
      {/* Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <StudentSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main
        className="
          lg:ml-[300px]
          pt-[84px]
          px-0
          pb-10
          transition-all
        "
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="
            glass
            rounded-none
            p-4
            sm:p-6
            min-h-[calc(100vh-120px)]
            border border-white/10
          "
        >
          <Outlet />
        </motion.div>

        {/* Footer (below content, aligned with sidebar offset) */}
        <div className="mt-6">
          <Footer />
        </div>
      </main>

      {/* AI Assistant */}
      <ChatbotWidget />
    </div>
  );
}
