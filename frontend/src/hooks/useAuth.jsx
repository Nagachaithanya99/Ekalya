import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { attachToken } from "../services/api";

export const useAuthToken = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    // Attach Clerk token to axios
    const detach = attachToken(getToken);

    return () => detach?.();
  }, [isLoaded, isSignedIn, getToken]);
};
