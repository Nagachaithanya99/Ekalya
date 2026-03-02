import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../services/api";

export default function useRole() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!isLoaded) return;

        if (!isSignedIn) {
          setRole("student");
          setLoading(false);
          return;
        }

        setLoading(true);

        const token = await getToken();
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRole(res.data?.role || "student");
      } catch (err) {
        // if any error (401 etc), fallback to student
        setRole("student");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoaded, isSignedIn, getToken]);

  return { role, isLoaded: isLoaded && !loading, loading };
}
