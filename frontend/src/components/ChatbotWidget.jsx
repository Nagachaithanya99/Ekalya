import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

const STORAGE_KEY = "lp_chat_history_v1";

function playBeep(type = "open") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    o.type = "sine";
    o.frequency.value = type === "send" ? 880 : 520;

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    o.start();
    o.stop(ctx.currentTime + 0.13);

    setTimeout(() => ctx.close(), 250);
  } catch {}
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [glow, setGlow] = useState(false);
  const [waveKey, setWaveKey] = useState(0);

  const listRef = useRef(null);
  const videoRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return [
      {
        role: "assistant",
        content:
          "Hi 👋 I’m your AI assistant.\nAsk doubts • Get summaries • Practice quiz questions.",
      },
    ];
  });

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // scroll
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  // glow on assistant reply
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 450);
      return () => clearTimeout(t);
    }
  }, [messages]);

  // ✅ wave every time you open
  useEffect(() => {
    if (!open) return;
    setWaveKey((k) => k + 1);
  }, [open]);

  // keep video playing smoothly
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play?.().catch(() => {});
  }, []);

  const toggleOpen = () => {
    playBeep("open");
    setOpen((s) => !s);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    playBeep("send");

    try {
      const res = await api.post("/ai/chat", {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI learning assistant for an Online Course Management System. " +
              "Be clear, short, and practical. Provide steps and examples. " +
              "If asked coding, answer with clean code blocks.",
          },
          ...nextMessages.slice(-24),
        ],
      });

      const reply = res.data?.reply || "No response received.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Chat failed. Check backend logs.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${msg}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    const base = [
      {
        role: "assistant",
        content:
          "Hi 👋 I’m your AI assistant.\nAsk doubts • Get summaries • Practice quiz questions.",
      },
    ];
    setMessages(base);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    } catch {}
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* ✅ BIGGER ROBOT BUTTON (circle outlet) */}
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`relative h-[110px] w-[110px] rounded-full overflow-hidden shadow-xl hover:shadow-[0_0_40px_rgba(43,108,255,0.45)] border border-white/10 ${
          glow ? "ring-4 ring-[#2b6cff]/45" : ""
        }`}
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(43,108,255,0.28), rgba(11,26,58,1) 60%)",
        }}
        aria-label="Open AI Assistant"
      >
        {/* wave wrapper */}
        <div
          key={waveKey}
          className={`absolute inset-0 flex items-center justify-center ${
            open ? "robot-wave" : ""
          }`}
        >
          {/* floating robot */}
          <div className="relative robot-float w-full h-full">
            {/* ✅ MP4 from PUBLIC (no import) */}
            <video
              ref={videoRef}
              src="/robot.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full rounded-full object-cover"
              style={{
                transform: "scale(1.12)", // ✅ zoom to fill circle (adjust 1.05–1.25)
                filter: sending
                  ? "drop-shadow(0 0 16px rgba(43,108,255,0.7))"
                  : "drop-shadow(0 0 10px rgba(43,108,255,0.35))",
              }}
            />

            {/* ✅ mouth bar overlay */}
            <div
              className={`robot-mouth absolute left-1/2 -translate-x-1/2 bottom-[18px] h-[8px] w-[34px] rounded-full ${
                sending ? "talking" : ""
              }`}
              style={{
                background: "rgba(130, 230, 255, 1)",
                boxShadow: sending
                  ? "0 0 16px rgba(130,230,255,0.95)"
                  : "0 0 10px rgba(130,230,255,0.35)",
              }}
            />
          </div>
        </div>

        {/* ✅ online dot */}
        <span className="absolute right-4 top-4 h-4 w-4 rounded-full bg-[#2b6cff] border border-white/40 shadow" />
      </motion.button>

      {/* ✅ PANEL (higher because button bigger) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-[135px] right-0 w-[360px] max-w-[90vw] glass rounded-3xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
              <div className="leading-tight">
                <p className="font-semibold">AI Assistant</p>
                <p className="text-xs text-white/60">
                  Ask doubts • Get summaries • Practice
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-xs px-3 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white text-xl leading-none px-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-[380px] overflow-auto p-4 space-y-3"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 border ${
                      m.role === "user"
                        ? "bg-[#2b6cff] text-white border-white/10"
                        : "bg-white/5 text-white border-white/10"
                    }`}
                  >
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="text-xs text-white/60">Thinking…</div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/15">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-white/20"
                />
                <button
                  onClick={send}
                  disabled={sending}
                  className="px-4 py-3 rounded-2xl bg-[#2b6cff] text-white font-semibold disabled:opacity-60"
                >
                  Send
                </button>
              </div>

              <p className="mt-2 text-[11px] text-white/45">
                Tip: Enter to send • Shift+Enter new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
