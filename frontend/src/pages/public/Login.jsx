import { useMemo, useState } from "react";
import { SignIn, useSignIn, useUser } from "@clerk/clerk-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";
import Logo from "../../components/common/Logo";

export default function Login() {
  const { isLoaded, isSignedIn } = useUser();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const [msg, setMsg] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const redirectTarget = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("redirect") || "/redirect";
  }, [location.search]);

  if (!isLoaded) return <Loader label="Loading login..." />;
  if (isSignedIn) return <Navigate to={redirectTarget} replace />;

  const startOAuth = async (provider) => {
    setMsg(null);

    if (!signInLoaded) {
      setMsg({ type: "warn", text: "Auth is still loading. Try again." });
      return;
    }

    try {
      const strategy = provider === "google" ? "oauth_google" : "oauth_github";

      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTarget,
      });
    } catch (err) {
      const code = err?.errors?.[0]?.code || "";
      const longMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Login failed";

      if (code === "external_account_not_found") {
        const reg = `/register?redirect=${encodeURIComponent(redirectTarget)}`;
        navigate(reg, { replace: true });
        return;
      }

      setMsg({ type: "error", text: longMessage });
    }
  };

  return (
    <div className="min-h-[78vh] grid place-items-center">
      <div className="grid lg:grid-cols-2 gap-6 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9"
        >
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" />

          <div className="relative space-y-4">
            <Logo size="large" />

            <p className="text-xs tracking-[0.25em] text-white/60">
              STUDENT • ADMIN • SECURE LOGIN
            </p>

            <h1 className="text-3xl md:text-4xl font-extrabold leading-snug">
              Welcome back to <span className="text-gold">Ekalya Learning Platform</span>
            </h1>

            <p className="text-white/70 leading-relaxed">
              Login to enroll, watch lessons, track progress, and download your
              certificates. Admins can manage courses, lessons, blogs, and messages.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <InfoCard title="Track progress" desc="Resume videos + progress analytics." />
              <InfoCard title="Certificates" desc="Earn certificates after completion." />
              <InfoCard title="Admin dashboard" desc="Manage courses, lessons, blogs." />
              <InfoCard title="Secure auth" desc="Powered by Clerk authentication." />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 glow-gold"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold">Login</h2>
            <p className="text-sm text-white/60 mt-1">Use your email / social login to continue.</p>
          </div>

          {msg && (
            <div
              className={`mb-4 rounded-2xl border p-3 text-sm ${
                msg.type === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-yellow-400/30 bg-yellow-500/10 text-yellow-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => startOAuth("github")}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold"
            >
              GitHub
            </button>

            <button
              type="button"
              onClick={() => startOAuth("google")}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold"
            >
              Google
            </button>
          </div>

          <div className="[&_*]:!font-[Poppins]">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              appearance={{
                elements: {
                  socialButtonsBlockButton: { display: "none" },
                  socialButtonsBlock: { display: "none" },
                  dividerRow: { display: "none" },
                },
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
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
