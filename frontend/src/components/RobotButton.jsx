import { motion } from "framer-motion";

export default function RobotButton({ open, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.06, rotate: open ? 0 : -2 }}
      whileTap={{ scale: 0.96 }}
      className="relative h-14 w-14 rounded-full border border-white/15 shadow-xl overflow-hidden
                 bg-gradient-to-br from-[#2b6cff] to-[#0b1d4a]"
      aria-label="Toggle AI Assistant"
      title="AI Assistant"
    >
      {/* soft glow */}
      <div className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), transparent 55%)",
        }}
      />

      {/* floating robot */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <RobotFace open={open} />
      </motion.div>

      {/* ping dot when closed */}
      {!open && (
        <motion.span
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#f7d774] border border-black/30"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

function RobotFace({ open }) {
  return (
    <div className="relative">
      {/* head */}
      <div className="h-9 w-9 rounded-2xl bg-white/90 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)] grid place-items-center">
        {/* visor */}
        <div className="relative h-4 w-7 rounded-xl bg-[#0b1d4a] border border-black/20 overflow-hidden flex items-center justify-center gap-1.5">
          {/* left eye (blink) */}
          <BlinkEye />
          {/* right eye (blink) */}
          <BlinkEye />

          {/* scanning line */}
          <motion.div
            className="absolute left-0 top-0 h-full w-3 bg-white/20"
            animate={{ x: [-10, 40] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* mouth */}
        <motion.div
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full bg-black/25"
          animate={open ? { width: [16, 10, 16] } : { width: 16 }}
          transition={{ duration: 0.6, repeat: open ? Infinity : 0 }}
        />
      </div>

      {/* antenna */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <div className="h-3 w-[2px] bg-white/70 mx-auto" />
        <motion.div
          className="h-2 w-2 rounded-full bg-[#f7d774] border border-black/20"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      </div>

      {/* tiny arms (wiggle on open) */}
      <motion.div
        className="absolute -left-3 top-4 h-[2px] w-3 bg-white/70 rounded-full"
        animate={open ? { rotate: [0, 12, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6, repeat: open ? Infinity : 0 }}
        style={{ transformOrigin: "right center" }}
      />
      <motion.div
        className="absolute -right-3 top-4 h-[2px] w-3 bg-white/70 rounded-full"
        animate={open ? { rotate: [0, -12, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6, repeat: open ? Infinity : 0 }}
        style={{ transformOrigin: "left center" }}
      />
    </div>
  );
}

function BlinkEye() {
  return (
    <div className="relative">
      <motion.span
        className="block h-[6px] w-[6px] rounded-full bg-[#2b6cff]"
        animate={{
          scaleY: [1, 1, 0.15, 1, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          times: [0, 0.45, 0.5, 0.55, 1],
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
