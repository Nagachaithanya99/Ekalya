import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { sendContactMessage } from "../../services/contactService";
import { FiMail, FiHelpCircle, FiShield, FiClock, FiSend } from "react-icons/fi";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    reason: "General", // ✅ UI-only (we’ll map to subject if subject empty)
  });

  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = useMemo(() => validate(form), [form]);
  const canSubmit = Object.keys(errors).length === 0 && !sending;

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 3500);
    return () => clearTimeout(t);
  }, [success]);

  const onChange = (e) => {
    setServerError("");
    setSuccess(false);
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true, reason: true });

    if (Object.keys(errors).length > 0) return;

    setSending(true);
    setServerError("");
    setSuccess(false);

    try {
      // ✅ If subject is empty, use reason as subject
      const payload = {
        name: form.name,
        email: form.email,
        subject: form.subject?.trim() ? form.subject : `(${form.reason})`,
        message: form.message,
      };

      await sendContactMessage(payload);
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "", reason: "General" });
      setTouched({});
    } catch (err) {
      console.error(err);
      setServerError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= TOP HERO ================= */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 md:p-10 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
        <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">
              Support • Feedback • Questions
            </p>

            <h1 className="text-3xl md:text-4xl font-extrabold">
              Contact <span className="text-gold">Us</span>
            </h1>

            <p className="text-white/70 leading-relaxed max-w-xl">
              Send your issue or feedback. Admin will receive it in the{" "}
              <span className="text-white/85 font-semibold">Admin → Messages</span>{" "}
              dashboard panel.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon={<FiHelpCircle />} text="Course support" />
              <Pill icon={<FiMail />} text="General queries" />
              <Pill icon={<FiShield />} text="Account & login" />
              <Pill icon={<FiClock />} text="Fast response" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <InfoCard title="Secure" desc="Validated inputs, safe handling." />
            <InfoCard title="Helpful" desc="Include course name + issue." />
            <InfoCard title="For Students" desc="Enrollment / Progress / Certs." />
            <InfoCard title="For Admin" desc="Courses / Lessons / Blogs." />
          </div>
        </div>
      </motion.section>

      {/* ================= FORM GRID ================= */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left: tips / FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="glass rounded-3xl p-6 md:p-8 space-y-4"
        >
          <h2 className="text-xl font-bold">Before you send</h2>

          <div className="space-y-3 text-sm text-white/70 leading-relaxed">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="font-semibold text-white/85">✅ Faster support</p>
              <p className="mt-1">
                Mention the course name, what page you were on, and any error message.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="font-semibold text-white/85">📌 Certificate issue?</p>
              <p className="mt-1">
                Certificates unlock after 100% completion and admin publishes it.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="font-semibold text-white/85">🔐 Login problem?</p>
              <p className="mt-1">
                Ensure you’re logged in via Clerk and try refreshing once.
              </p>
            </div>
          </div>

          <div className="aurora-line rounded-full" />
          <p className="text-xs text-white/55">
            Theme: <span className="text-gold font-semibold">Gold</span> +{" "}
            <span style={{ color: "var(--fire)" }} className="font-semibold">Fire</span> +{" "}
            <span style={{ color: "var(--water)" }} className="font-semibold">Water</span>
          </p>
        </motion.div>

        {/* Right: form */}
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          onSubmit={submit}
          className="glass rounded-3xl p-6 md:p-8 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Send a message</h2>
            <span className="text-xs text-white/50">* required</span>
          </div>

          {success && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-emerald-200 text-sm">
              ✅ Message sent successfully! Admin will review it soon.
            </div>
          )}

          {serverError && (
            <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-red-200 text-sm">
              {serverError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="Your Name *"
              name="name"
              value={form.name}
              onChange={onChange}
              onBlur={onBlur}
              error={touched.name ? errors.name : ""}
              placeholder="Enter your name"
            />

            <Input
              label="Email *"
              name="email"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur}
              error={touched.email ? errors.email : ""}
              placeholder="you@example.com"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Select
              label="Reason"
              name="reason"
              value={form.reason}
              onChange={onChange}
              onBlur={onBlur}
              options={[
                "General",
                "Course Enrollment",
                "Lesson / Video Issue",
                "Progress Tracking",
                "Certificate",
                "Login / Account",
                "Payment / Pricing",
              ]}
            />

            <Input
              label="Subject (optional)"
              name="subject"
              value={form.subject}
              onChange={onChange}
              onBlur={onBlur}
              error={touched.subject ? errors.subject : ""}
              placeholder="Optional subject"
            />
          </div>

          <Textarea
            label="Message *"
            name="message"
            value={form.message}
            onChange={onChange}
            onBlur={onBlur}
            error={touched.message ? errors.message : ""}
            placeholder="Write your message clearly…"
          />

          <motion.button
            whileHover={{ scale: canSubmit ? 1.01 : 1 }}
            whileTap={{ scale: canSubmit ? 0.99 : 1 }}
            disabled={!canSubmit}
            className="w-full px-5 py-3 rounded-xl bg-[#f7d774] text-black font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <FiSend />
            {sending ? "Sending..." : "Send Message"}
          </motion.button>

          <p className="text-xs text-white/50">
            Tip: If possible, share the exact error text (copy/paste) for faster help.
          </p>
        </motion.form>
      </div>
    </div>
  );
}

/* ---------------- UI small comps ---------------- */

function Pill({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/70">
      <span className="text-white/70">{icon}</span>
      {text}
    </span>
  );
}

function InfoCard({ title, desc }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-white/65 mt-1">{desc}</p>
    </div>
  );
}

function Input({ label, error, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border outline-none transition
          ${error ? "border-red-400/40" : "border-white/10"}
          focus:border-[#f7d774]/40`}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none transition focus:border-[#f7d774]/40"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-black">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, error, ...props }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-white/70">{label}</span>
      <textarea
        {...props}
        rows={7}
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border outline-none transition
          ${error ? "border-red-400/40" : "border-white/10"}
          focus:border-[#f7d774]/40`}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

/* ---------------- Validation ---------------- */

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = "Name is required.";
  if (!form.email.trim()) e.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    e.email = "Enter a valid email address.";
  if (form.subject && form.subject.length > 120)
    e.subject = "Subject is too long (max 120).";
  if (!form.message.trim()) e.message = "Message is required.";
  else if (form.message.trim().length < 10)
    e.message = "Message should be at least 10 characters.";
  return e;
}
