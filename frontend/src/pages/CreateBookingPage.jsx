import { useEffect, useMemo, useState } from "react";
import { createBooking } from "../services/bookingApi";
import { getAllResources } from "../services/resourceApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import FloatingToast from "../components/common/FloatingToast";
import StyledSelect from "../components/common/StyledSelect";

const initialForm = {
  resourceId: "",
  date: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: "",
};

const bookingCategoryOptions = [
  { value: "", label: "All Categories" },
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Lab" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const getTodayLocalDateString = () => {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().split("T")[0];
};

const toMinutes = (timeString) => {
  if (!timeString || !timeString.includes(":")) {
    return null;
  }

  const [hours, minutes] = timeString.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

function CreateBookingPage() {
  const [form, setForm] = useState(initialForm);
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const minBookingDate = useMemo(() => getTodayLocalDateString(), []);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadResources = async () => {
      setLoadingResources(true);

      try {
        const res = await getAllResources({ status: "ACTIVE" });
        setResources(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load resources for booking.");
      } finally {
        setLoadingResources(false);
      }
    };

    void loadResources();
  }, []);

  const categoryOptions = useMemo(() => {
    const knownTypes = new Set(bookingCategoryOptions.map((option) => option.value));
    const dynamicTypes = Array.from(
      new Set(resources.map((resource) => resource.type).filter(Boolean))
    )
      .filter((type) => !knownTypes.has(type))
      .map((type) => ({ value: type, label: type }));

    return [...bookingCategoryOptions, ...dynamicTypes];
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!selectedCategory) {
      return resources;
    }

    return resources.filter((resource) => resource.type === selectedCategory);
  }, [resources, selectedCategory]);

  const resourceOptions = useMemo(
    () =>
      filteredResources.map((resource) => ({
        value: resource.id,
        label: `${resource.id} - ${resource.name || "Unnamed"} (${resource.type || "N/A"})`,
      })),
    [filteredResources]
  );

  useEffect(() => {
    if (!form.resourceId) {
      return;
    }

    const stillExists = filteredResources.some((resource) => resource.id === form.resourceId);
    if (!stillExists) {
      setForm((prev) => ({ ...prev, resourceId: "" }));
    }
  }, [filteredResources, form.resourceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.resourceId) {
      setError("Please select a resource ID.");
      return;
    }

    if (form.date && form.date < minBookingDate) {
      setError("Booking date cannot be in the past.");
      return;
    }

    const startMinutes = toMinutes(form.startTime);
    const endMinutes = toMinutes(form.endTime);

    if (startMinutes === null || endMinutes === null) {
      setError("Please select a valid start and end time.");
      return;
    }

    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < 30) {
      setError("Time range must be at least 30 minutes.");
      return;
    }

    if (durationMinutes > 240) {
      setError("Time range cannot exceed 4 hours.");
      return;
    }

    try {
      await createBooking({
        ...form,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null,
      });
      showToast("Booking request submitted successfully.");
      setError("");
      setForm(initialForm);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create booking request.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Create Booking Request"
      subtitle="Submit purpose, schedule, and attendance details for approval"
    >
      <section className="panel max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource Category</label>
            <StyledSelect
              name="resourceCategory"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              options={categoryOptions}
              disabled={loadingResources}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource ID</label>
            <StyledSelect
              className="w-full"
              name="resourceId"
              value={form.resourceId}
              onChange={handleChange}
              options={resourceOptions}
              placeholder={loadingResources ? "Loading resources..." : "Select resource ID"}
              searchable
              searchPlaceholder="Search by resource ID or name"
              disabled={loadingResources || resourceOptions.length === 0}
            />
            {resourceOptions.length === 0 && !loadingResources && (
              <p className="mt-1 text-xs text-slate-500">No resources available for the selected category.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              className="field"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              min={minBookingDate}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected Attendees</label>
            <input
              className="field"
              name="expectedAttendees"
              type="number"
              min="1"
              value={form.expectedAttendees}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
            <input className="field" name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
            <input className="field" name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
            <p className="mt-1 text-xs text-slate-500">Duration must be between 30 minutes and 4 hours.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Purpose</label>
            <textarea
              className="field min-h-24"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of this booking"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit">Submit Booking Request</button>
          </div>
        </form>
      </section>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default CreateBookingPage;
