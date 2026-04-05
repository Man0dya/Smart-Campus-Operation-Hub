import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    minCapacity: "",
    maxCapacity: "",
    location: "",
    status: "",
  });

  const loadResources = useCallback(async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      const res = await api.get("/resources", { params });
      setResources(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load resources.");
    }
  }, [filters]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AuthenticatedLayout
      title="Facilities & Assets Catalogue"
      subtitle="Find and filter bookable rooms, labs, and equipment"
    >
      <section className="panel mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select className="field" name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="LECTURE_HALL">Lecture Hall</option>
          <option value="LAB">Lab</option>
          <option value="MEETING_ROOM">Meeting Room</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>
        <input
          className="field"
          name="minCapacity"
          type="number"
          min="0"
          placeholder="Min capacity"
          value={filters.minCapacity}
          onChange={handleFilterChange}
        />
        <input
          className="field"
          name="maxCapacity"
          type="number"
          min="0"
          placeholder="Max capacity"
          value={filters.maxCapacity}
          onChange={handleFilterChange}
        />
        <input
          className="field"
          name="location"
          placeholder="Location"
          value={filters.location}
          onChange={handleFilterChange}
        />
        <select className="field" name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </section>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.length === 0 && (
          <div className="panel col-span-full text-sm text-slate-600">No resources match your filters.</div>
        )}
        {resources.map((resource) => (
          <article key={resource.id} className="panel transition hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{resource.name}</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  resource.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {resource.status}
              </span>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">Type:</span> {resource.type}</p>
              <p><span className="font-semibold text-slate-700">Capacity:</span> {resource.capacity || "N/A"}</p>
              <p><span className="font-semibold text-slate-700">Location:</span> {resource.location || "N/A"}</p>
              <p><span className="font-semibold text-slate-700">Availability:</span> {resource.availabilityStart || "-"} to {resource.availabilityEnd || "-"}</p>
              {resource.description && <p className="pt-2 text-slate-500">{resource.description}</p>}
            </div>
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default ResourcesPage;