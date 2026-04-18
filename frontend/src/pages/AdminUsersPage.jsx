import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  createAdminUser,
  deleteAdminUser,
  getAllUsers,
  updateAdminUser,
} from "../services/adminUserApi";
import {
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import AuthContext from "../context/auth-context";

const emptyForm = {
  name: "",
  email: "",
  role: "USER",
  password: "",
};

const getRoleChipClass = (role) => {
  const normalized = String(role || "").toUpperCase();

  if (normalized === "ADMIN") {
    return "chip-danger";
  }
  if (normalized === "TECHNICIAN") {
    return "chip-warning";
  }

  return "chip-neutral";
};

function AdminUsersPage() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data || []);
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

  const openCreateDrawer = () => {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
    setError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (selectedUser) => {
    setEditingId(selectedUser.id);
    setForm({
      name: selectedUser.name || "",
      email: selectedUser.email || "",
      role: selectedUser.role || "USER",
      password: "",
    });
    setMessage("");
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const submitLabel = useMemo(() => (editingId ? "Update User" : "Create User"), [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      password: form.password,
    };

    if (!editingId && !payload.password) {
      setError("Password is required for new users.");
      return;
    }

    try {
      if (editingId) {
        await updateAdminUser(editingId, payload);
        setMessage("User updated.");
      } else {
        await createAdminUser(payload);
        setMessage("User created.");
      }

      setDrawerOpen(false);
      setEditingId("");
      setForm(emptyForm);
      setError("");
      await loadUsers();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to save user.");
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminUser(userId);
      setMessage("User deleted.");
      setError("");
      await loadUsers();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to delete user.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Admin User Access"
      subtitle="Create, edit, and remove user accounts with role control"
    >
      <section className="panel mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            className="field max-w-md"
            placeholder="Search users by name or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button className="btn-secondary gap-2" onClick={() => void loadUsers()}>
              <HiOutlineArrowPath className="h-4 w-4" />
              Refresh
            </button>
            <button className="btn-primary gap-2" onClick={openCreateDrawer}>
              <HiOutlinePlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </section>

      {message && <p className="status-success mb-4 rounded-xl px-4 py-3 text-sm">{message}</p>}
      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <section className="panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Login Method</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="align-middle hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-800">{user.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getRoleChipClass(user.role)}`}>{user.role || "USER"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.googleId ? "Google" : "Local account"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => openEditDrawer(user)}
                        title="Edit user"
                        aria-label="Edit user"
                      >
                        <HiOutlinePencilSquare className="h-5 w-5" />
                      </button>
                      <button
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          currentUser?.id === user.id
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                        onClick={() => void handleDelete(user.id)}
                        title="Delete user"
                        aria-label="Delete user"
                        disabled={currentUser?.id === user.id}
                      >
                        <HiOutlineTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-[70] bg-slate-950/50 transition-opacity duration-250 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
      />
      <aside
        className={`fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{submitLabel}</h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={closeDrawer}
            aria-label="Close panel"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              className="field"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="USER">USER</option>
              <option value="TECHNICIAN">TECHNICIAN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {editingId ? "Password (leave blank to keep current)" : "Password"}
            </label>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={editingId ? "Optional password update" : "Minimum 6 characters"}
              required={!editingId}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">{submitLabel}</button>
            <button type="button" className="btn-secondary" onClick={closeDrawer}>Cancel</button>
          </div>
        </form>
      </aside>
    </AuthenticatedLayout>
  );
}

export default AdminUsersPage;
