import { useCallback, useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  createResource,
  deleteResource,
  getAllResources,
  updateResource,
} from "../services/resourceApi";

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
    setMessage("");
    setError("");
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
      <section className="panel mb-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{submitLabel}</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="field"
            placeholder="Resource name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

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

          <input
            className="field"
            type="number"
            min="0"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
          />

          <input
            className="field"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          />

          <input
            className="field"
            type="time"
            value={form.availabilityStart}
            onChange={(e) => setForm((prev) => ({ ...prev, availabilityStart: e.target.value }))}
          />

          <input
            className="field"
            type="time"
            value={form.availabilityEnd}
            onChange={(e) => setForm((prev) => ({ ...prev, availabilityEnd: e.target.value }))}
          />

          <select
            className="field"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>

          <textarea
            className="field min-h-24 sm:col-span-2 lg:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary">{submitLabel}</button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingId("");
                  setForm(emptyForm);
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {message && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.length === 0 && (
          <div className="panel col-span-full text-sm text-slate-600">No resources found.</div>
        )}
        {resources.map((resource) => (
          <article key={resource.id} className="panel">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">{resource.name}</h3>
              <span className="chip">{resource.status}</span>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">Type:</span> {resource.type}</p>
              <p><span className="font-semibold text-slate-700">Capacity:</span> {resource.capacity ?? "N/A"}</p>
              <p><span className="font-semibold text-slate-700">Location:</span> {resource.location || "N/A"}</p>
              <p><span className="font-semibold text-slate-700">Availability:</span> {resource.availabilityStart || "-"} to {resource.availabilityEnd || "-"}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="btn-secondary" onClick={() => handleEdit(resource)}>Edit</button>
              <button className="btn-secondary" onClick={() => handleDelete(resource.id)}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminResourcesPage;
