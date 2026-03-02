import { motion } from "framer-motion";

const tintMap = {
  gold: "rgba(247,215,116,0.25)",
  fire: "rgba(255,77,46,0.22)",
  water: "rgba(0,209,255,0.22)",
  cold: "rgba(106,124,255,0.22)",
};

export default function DashboardCard({ title, value, icon, tint = "gold", subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass rounded-3xl p-5 border border-white/10 relative overflow-hidden"
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl"
        style={{ background: tintMap[tint] || tintMap.gold }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/60">{title}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-white/55">{subtitle}</p>}
        </div>

        <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/15 grid place-items-center text-xl">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
