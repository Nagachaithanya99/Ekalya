import { useUser } from "@clerk/clerk-react";

export default function Profile() {
  const { user } = useUser();

  return (
    <div className="pt-32 px-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Admin Profile</h1>
      <p>Email: {user?.emailAddresses[0].emailAddress}</p>
      <p>Role: Admin</p>
    </div>
  );
}
