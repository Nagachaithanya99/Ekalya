import { motion } from "framer-motion";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[#07070b]">
      <div className="glass glow-gold rounded-2xl px-10 py-8 text-center">
        <motion.div
          className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-white/20 border-t-[#f7d774]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-white/80">{label}</p>
      </div>
    </div>
  );
}
