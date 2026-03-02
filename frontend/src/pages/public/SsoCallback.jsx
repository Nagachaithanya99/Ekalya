import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export default function SsoCallback() {
  return (
    <div className="min-h-[70vh] grid place-items-center text-white">
      <div className="glass rounded-3xl p-8 border border-white/10 text-center">
        <p className="text-lg font-semibold">Completing sign in…</p>
        <p className="text-white/60 mt-2">Please wait</p>
      </div>

      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/login"
        signUpFallbackRedirectUrl="/register"
      />
    </div>
  );
}
