import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { Outlet } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import Footer from "../components/Footer";

export default function AdminLayout() {
  return (
    <div className="min-h-screen app-bg text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Page body */}
      <div className="flex flex-1">
        {/* Fixed Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="ml-[280px] w-full p-0 flex flex-col">
          {/* Content glass */}
          <div className="glass rounded-none p-6 border border-white/10 flex-1">
            <Outlet />
          </div>

          {/* Footer aligned with content width (not under sidebar) */}
          <div className="mt-6">
            <Footer />
          </div>
        </main>
      </div>

      {/* AI Chatbot – floats above everything */}
      <ChatbotWidget />
    </div>
  );
}
