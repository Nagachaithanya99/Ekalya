import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import TopBar from "../components/layout/TopBar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import Container from "../components/ui/Container";

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#07080d] text-white app-bg">
      <TopBar />

      <main className="pb-24 md:pb-10 pt-4 md:pt-6">
        <Container>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="min-h-[calc(100vh-150px)]"
          >
            <Outlet />
          </motion.div>
        </Container>
      </main>

      <MobileBottomNav />
    </div>
  );
}
