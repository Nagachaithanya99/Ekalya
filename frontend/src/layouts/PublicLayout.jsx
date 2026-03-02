import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AnimatePresence, motion } from "framer-motion";
import ChatbotWidget from "../components/ChatbotWidget";
import Footer from "../components/Footer";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen app-bg flex flex-col">
      <Navbar />

      {/* top subtle divider line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <main className="mx-auto max-w-7xl px-5 py-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer always at bottom */}
      <Footer />

      {/* AI Chatbot floating widget */}
      <ChatbotWidget />
    </div>
  );
}
