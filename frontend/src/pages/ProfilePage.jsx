import { useContext, useState } from "react";
import AuthContext from "../context/auth-context";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import FloatingToast from "../components/common/FloatingToast";
import { updateMyAvailability } from "../services/userApi";

function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [error, setError] = useState("");

  const handleToggleAvailability = async () => {
    if (!user || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await updateMyAvailability({ available: !user.available });
      setUser(res.data);
      setToast({
        open: true,
        message: `You are now ${res.data.available ? "available" : "unavailable"} for assignments.`,
        type: "success",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update availability.");
      setToast({ open: true, message: "Unable to update availability.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
        <p className="panel text-sm text-slate-600">No user profile loaded.</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Profile" subtitle="Account details and role permissions">
      <section className="panel max-w-2xl space-y-6">
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

        {user.role === "TECHNICIAN" && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Assignment Availability</p>
                <p className="mt-1 text-sm text-slate-600">
                  When unavailable, admins will not assign new tickets to you. Existing tickets remain unchanged.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {user.available ? "Available" : "Unavailable"}
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleToggleAvailability}
                  disabled={loading}
                >
                  {loading ? "Saving..." : user.available ? "Set Unavailable" : "Set Available"}
                </button>
              </div>
            </div>
          </div>
        )}


        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default ProfilePage;
