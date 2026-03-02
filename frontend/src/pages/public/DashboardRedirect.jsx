import { Navigate } from "react-router-dom";
import Loader from "../../components/Loader";
import useRole from "../../hooks/useRole";

export default function DashboardRedirect() {
  const { role, isLoaded } = useRole();

  if (!isLoaded) return <Loader label="Redirecting..." />;

  return <Navigate to={role === "admin" ? "/admin" : "/student"} replace />;
}
