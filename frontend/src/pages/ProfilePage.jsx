import { useContext } from "react";
import AuthContext from "../context/auth-context";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function ProfilePage() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
        <p className="panel text-sm text-slate-600">No user profile loaded.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
      <section className="panel max-w-2xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="h-28 w-28 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold text-slate-500">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Name:</span> {user.name}</p>
            <p><span className="font-semibold text-slate-900">Email:</span> {user.email}</p>
            <p>
              <span className="font-semibold text-slate-900">Role:</span>
              <span className="ml-2 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                {user.role}
              </span>
            </p>
          </div>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}

export default ProfilePage;
