import { useCallback, useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  createResource,
  deleteResource,
  getAllResources,
  updateResource,
} from "../services/resourceApi";
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";

const getResourceStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") {
    return "chip-success";
  }
  if (["OUT_OF_SERVICE", "INACTIVE", "DISABLED"].includes(normalized)) {
    return "chip-danger";
  }

  return "chip-neutral";
};

const emptyForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  availabilityStart: "08:00",
  availabilityEnd: "17:00",
  status: "ACTIVE",
  description: "",
};

function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadResources = useCallback(async () => {
    try {
      const res = await getAllResources();
      setResources(res.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load resources.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadResources();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadResources]);

  const submitLabel = useMemo(() => {
    if (editingId) {
      return "Update Resource";
    }
    return "Create Resource";
  }, [editingId]);

  const toPayload = (value) => ({
    ...value,
    capacity: value.capacity === "" ? null : Number(value.capacity),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateResource(editingId, payload);
        setMessage("Resource updated.");
      } else {
        await createResource(payload);
        setMessage("Resource created.");
      }
      setForm(emptyForm);
      setEditingId("");
      setDrawerOpen(false);
      setError("");
      await loadResources();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to save resource.");
    }
  };

  const handleEdit = (resource) => {
    setForm({
      name: resource.name || "",
      type: resource.type || "LECTURE_HALL",
      capacity: resource.capacity ?? "",
      location: resource.location || "",
      availabilityStart: resource.availabilityStart || "08:00",
      availabilityEnd: resource.availabilityEnd || "17:00",
      status: resource.status || "ACTIVE",
      description: resource.description || "",
    });
    setEditingId(resource.id);
    setDrawerOpen(true);
    setMessage("");
    setError("");
  };

  const openCreateDrawer = () => {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
    setError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this resource?");
    if (!confirmed) {
      return;
    }
    try {
      await deleteResource(id);
      setMessage("Resource deleted.");
      setError("");
      if (editingId === id) {
        setEditingId("");
        setForm(emptyForm);
      }
      await loadResources();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to delete resource.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Admin Resource Management"
      subtitle="Full CRUD control for campus rooms, labs, and equipment"
    >
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Current Resources</h2>
          <p className="text-sm text-slate-500">Manage all resources from one clean view.</p>
        </div>
        <button type="button" className="btn-primary gap-2" onClick={openCreateDrawer}>
          <HiOutlinePlus className="h-4 w-4" />
          Add Resource
        </button>
      </section>

      {message && <p className="status-success mb-4 rounded-xl px-4 py-3 text-sm">{message}</p>}
      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <section className="panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Availability</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">{resource.name}</p>
                    {resource.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{resource.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{resource.type}</td>
                  <td className="px-4 py-3 text-slate-700">{resource.capacity ?? "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{resource.location || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {resource.availabilityStart || "-"} - {resource.availabilityEnd || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getResourceStatusClass(resource.status)}`}>{resource.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Resource"
                        aria-label="Edit Resource"
                        onClick={() => handleEdit(resource)}
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Delete Resource"
                        aria-label="Delete Resource"
                        onClick={() => handleDelete(resource.id)}
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resources.length === 0 && (
          <div className="p-6 text-sm text-slate-600">No resources found.</div>
        )}
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource Name</label>
            <input
              className="field"
              placeholder="Resource name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                className="field"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
              <input
                className="field"
                type="number"
                min="0"
                placeholder="Capacity"
                value={form.capacity}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              className="field"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Available From</label>
              <input
                className="field"
                type="time"
                value={form.availabilityStart}
                onChange={(e) => setForm((prev) => ({ ...prev, availabilityStart: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Available To</label>
              <input
                className="field"
                type="time"
                value={form.availabilityEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, availabilityEnd: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              className="field"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="field min-h-24"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">{submitLabel}</button>
            <button type="button" className="btn-secondary" onClick={closeDrawer}>
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </AuthenticatedLayout>
  );
}

export default AdminResourcesPage;
