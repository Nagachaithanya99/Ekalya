import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import Button from "../../components/ui/Button";

export default function Profile() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <div className="text-white/60">Loading profile...</div>;

  const name = user?.fullName || "Student";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const role = user?.publicMetadata?.role || "student";
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Profile"
        subtitle="Manage your account and quickly access your student actions."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/15 bg-white/8 text-3xl font-extrabold text-[#f7d774]">
              {name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold">{name}</p>
              <p className="truncate text-sm text-white/70">{email}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Meta label="Role" value={role} />
            <Meta label="Joined" value={joined} />
            <Meta label="Status" value="Active" />
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <h2 className="text-lg font-bold">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <Link to="/user-profile" className="block">
              <Button full variant="ghost">Manage Account</Button>
            </Link>
            <Link to="/student/jobs" className="block">
              <Button full variant="ghost">Jobs</Button>
            </Link>
            <Link to="/student/certificates" className="block">
              <Button full variant="ghost">Messages/Certificates</Button>
            </Link>
            <Link to="/student/my-courses" className="block">
              <Button full variant="ghost">Saved</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/6 p-3">
      <p className="text-xs text-white/65">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
