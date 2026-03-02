import { useMemo } from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../../components/Loader";

export default function Login() {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  const redirectTarget = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("redirect") || "/redirect";
  }, [location.search]);

  if (!isLoaded) return <Loader label="Loading login..." />;
  if (isSignedIn) return <Navigate to={redirectTarget} replace />;

  return (
    <div className="min-h-[78vh] grid place-items-center">
      <SignIn routing="path" path="/login" signUpUrl="/register" />
    </div>
  );
}
