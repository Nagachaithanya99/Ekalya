import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "./common/Logo";

export default function Sidebar({
  title,
  items,
  width = 300,
  topOffset = 72,          // navbar height
  fixed = true,            // admin: fixed sidebar, student: embedded
  onItemClick,             // optional: close mobile drawer on click
}) {
  const AsideTag = fixed ? "aside" : "div";

  return (
    <AsideTag
      className={fixed ? "fixed left-0 z-40" : "w-full"}
      style={
        fixed
          ? {
              width,
              top: `${topOffset}px`,
              height: `calc(100vh - ${topOffset}px)`,
            }
          : undefined
      }
    >
      {/* ✅ Make it flex column so the nav can scroll */}
      <div className="h-full glass border-r border-white/10 px-4 py-6 flex flex-col min-h-0">
        {/* Title */}
        <div className="mb-6 px-2 shrink-0">
          <div className="mb-2">
            <Logo size="small" />
          </div>
          <h2 className="text-2xl font-extrabold text-gold tracking-wide">{title}</h2>
          <p className="text-xs text-white/55">Ekalya Learning Platform</p>
        </div>

        {/* ✅ Scrollable menu area */}
        <nav
          className="space-y-3 mt-2 flex-1 min-h-0 overflow-y-auto pr-1"
          style={{
            scrollbarGutter: "stable",
          }}
        >
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end === true}
              onClick={() => onItemClick?.()}
              className={({ isActive }) =>
                `
                group flex items-center gap-4 rounded-2xl px-5 py-4
                text-[18px] font-semibold tracking-wide
                transition-all duration-200
                ${
                  isActive
                    ? "bg-white/10 border border-gold/40 shadow-[0_0_20px_rgba(247,215,116,0.35)]"
                    : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                }
              `
              }
            >
              <motion.span whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.98 }} className="text-2xl">
                {item.icon}
              </motion.span>

              <span className="flex-1">{item.label}</span>

              <span
                className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.25)]
                ${
                  item.tint === "gold"
                    ? "bg-yellow-400"
                    : item.tint === "fire"
                    ? "bg-red-500"
                    : item.tint === "water"
                    ? "bg-cyan-400"
                    : "bg-blue-400"
                }`}
              />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        
      </div>
    </AsideTag>
  );
}
