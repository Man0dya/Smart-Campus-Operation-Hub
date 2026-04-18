import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
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

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return resources;
    }

    return resources.filter((resource) => {
      const haystack = [
        resource.name,
        resource.type,
        resource.location,
        resource.description,
        resource.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [resources, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredResources.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredResources.length, page, pageSize]);

  const paginatedResources = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, page, pageSize]);

  return (
    <AuthenticatedLayout
      title="Facilities & Assets Catalogue"
      subtitle="Find and filter bookable rooms, labs, and equipment"
    >
      <section className="panel mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="field"
          name="search"
          placeholder="Search name, type, location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <StyledSelect
          className="w-full"
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          options={[
            { value: "", label: "All Types" },
            { value: "LECTURE_HALL", label: "Lecture Hall" },
            { value: "LAB", label: "Lab" },
            { value: "MEETING_ROOM", label: "Meeting Room" },
            { value: "EQUIPMENT", label: "Equipment" },
          ]}
        />
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
        <StyledSelect
          className="w-full"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          options={[
            { value: "", label: "All Status" },
            { value: "ACTIVE", label: "Active" },
            { value: "OUT_OF_SERVICE", label: "Out of Service" },
          ]}
        />
      </section>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredResources.length === 0 && (
          <div className="panel col-span-full text-sm text-slate-600">No resources match your filters.</div>
        )}
        {paginatedResources.map((resource) => (
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

      {filteredResources.length > 0 && (
        <section className="panel mt-4 p-0">
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredResources.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[9, 18, 27]}
          />
        </section>
      )}
    </AuthenticatedLayout>
  );
}

export default ResourcesPage;