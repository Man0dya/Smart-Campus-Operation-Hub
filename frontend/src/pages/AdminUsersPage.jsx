import { useCallback, useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { getAllUsers, updateUserRole } from "../services/adminUserApi";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [draftRoles, setDraftRoles] = useState({});
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
      const data = res.data || [];
      setUsers(data);
      setDraftRoles((prev) => {
        const next = { ...prev };
        data.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = item.role || "USER";
          }
        });
        return next;
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load users.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!filter.trim()) {
      return users;
    }

    const keyword = filter.trim().toLowerCase();
    return users.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      return name.includes(keyword) || email.includes(keyword);
    });
  }, [users, filter]);

  const handleSaveRole = async (userId) => {
    try {
      const role = draftRoles[userId];
      await updateUserRole(userId, role);
      setMessage("User role updated.");
      setError("");
      await loadUsers();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to update user role.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Admin User Access"
      subtitle="Assign platform roles and control dashboard-level access"
    >
      <section className="panel mb-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <input
            className="field"
            placeholder="Search users by name or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn-secondary" onClick={() => void loadUsers()}>
            Refresh List
          </button>
        </div>
      </section>

      {message && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="panel overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Current Role</th>
              <th className="px-3 py-2 font-semibold">Login Method</th>
              <th className="px-3 py-2 font-semibold">Assign Role</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>
                  No users found.
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 align-middle">
                <td className="px-3 py-3 text-slate-800">{user.name || "-"}</td>
                <td className="px-3 py-3 text-slate-700">{user.email || "-"}</td>
                <td className="px-3 py-3">
                  <span className="chip">{user.role || "USER"}</span>
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {user.googleId ? "Google" : "Local account"}
                </td>
                <td className="px-3 py-3">
                  <select
                    className="field min-w-40"
                    value={draftRoles[user.id] || "USER"}
                    onChange={(e) => {
                      const { value } = e.target;
                      setDraftRoles((prev) => ({ ...prev, [user.id]: value }));
                    }}
                  >
                    <option value="USER">USER</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-3 py-3">
                  <button className="btn-primary" onClick={() => void handleSaveRole(user.id)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminUsersPage;
