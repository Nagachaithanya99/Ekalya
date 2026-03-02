import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

export default function useClerkAuth() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      console.log("Logged in role:", user.publicMetadata?.role);
    }
  }, [isLoaded, user]);
}
