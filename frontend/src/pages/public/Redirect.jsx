import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Loader from "../../components/Loader";
import api  from "../../services/api";

export default function Redirect() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        if (!isLoaded) return;

        if (!isSignedIn) {
          navigate("/login", { replace: true });
          return;
        }

        const token = await getToken();
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const role = res.data?.role || "student";
        navigate(role === "admin" ? "/admin" : "/student", { replace: true });
      } catch (err) {
        // Safe fallback
        navigate("/student", { replace: true });
      }
    };

    run();
  }, [isLoaded, isSignedIn, getToken, navigate]);

  return <Loader label="Redirecting..." />;
}
