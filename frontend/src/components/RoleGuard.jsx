import { Navigate } from "react-router-dom";
import Loader from "./Loader";
import useRole from "../hooks/useRole";

export default function RoleGuard({ allow = [], children }) {
  const { role, isLoaded, loading } = useRole();

  if (!isLoaded || loading) return <Loader label="Checking role..." />;

  if (!role || (allow.length > 0 && !allow.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
