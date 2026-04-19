import { useEffect, useMemo, useState } from "react";
import { createBooking, getBookingAvailability } from "../services/bookingApi";
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

const toTimeLabel = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

function CreateBookingPage() {
  const [form, setForm] = useState(initialForm);
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
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

  useEffect(() => {
    setAvailability(null);
    setForm((prev) => ({ ...prev, startTime: "", endTime: "" }));

    if (!form.resourceId || !form.date) {
      return;
    }

    const loadAvailability = async () => {
      setLoadingAvailability(true);

      try {
        const res = await getBookingAvailability(form.resourceId, form.date);
        setAvailability(res.data || null);
      } catch (err) {
        setAvailability(null);
        setError(err?.response?.data?.error || "Failed to load available time slots.");
      } finally {
        setLoadingAvailability(false);
      }
    };

    void loadAvailability();
  }, [form.resourceId, form.date]);

  const availableSegments = useMemo(() => {
    const dayStart = toMinutes(availability?.availabilityStart || "");
    const dayEnd = toMinutes(availability?.availabilityEnd || "");

    if (dayStart === null || dayEnd === null || dayEnd <= dayStart) {
      return [];
    }

    const blocked = (availability?.blockedIntervals || [])
      .map((interval) => ({
        start: toMinutes(interval.startTime),
        end: toMinutes(interval.endTime),
      }))
      .filter((interval) => interval.start !== null && interval.end !== null && interval.end > interval.start)
      .sort((left, right) => left.start - right.start);

    const merged = [];
    blocked.forEach((interval) => {
      if (merged.length === 0 || interval.start > merged[merged.length - 1].end) {
        merged.push({ ...interval });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
      }
    });

    const segments = [];
    let cursor = dayStart;

    merged.forEach((interval) => {
      if (interval.start > cursor) {
        segments.push({ start: cursor, end: Math.min(interval.start, dayEnd) });
      }
      cursor = Math.max(cursor, interval.end);
    });

    if (cursor < dayEnd) {
      segments.push({ start: cursor, end: dayEnd });
    }

    return segments.filter((segment) => segment.end - segment.start >= 30);
  }, [availability]);

  const startTimeOptions = useMemo(() => {
    const options = [];

    availableSegments.forEach((segment) => {
      for (let minute = segment.start; minute + 30 <= segment.end; minute += 30) {
        const value = toTimeLabel(minute);
        options.push({ value, label: value });
      }
    });

    return options;
  }, [availableSegments]);

  const endTimeOptions = useMemo(() => {
    const start = toMinutes(form.startTime);

    if (start === null) {
      return [];
    }

    const segment = availableSegments.find((candidate) => start >= candidate.start && start < candidate.end);
    if (!segment) {
      return [];
    }

    const options = [];
    for (let minute = start + 30; minute <= segment.end && minute - start <= 240; minute += 30) {
      const value = toTimeLabel(minute);
      options.push({ value, label: value });
    }

    return options;
  }, [availableSegments, form.startTime]);

  useEffect(() => {
    if (!form.startTime || endTimeOptions.length === 0) {
      if (form.endTime) {
        setForm((prev) => ({ ...prev, endTime: "" }));
      }
      return;
    }

    const isCurrentEndValid = endTimeOptions.some((option) => option.value === form.endTime);
    if (!isCurrentEndValid) {
      setForm((prev) => ({ ...prev, endTime: "" }));
    }
  }, [form.startTime, form.endTime, endTimeOptions]);

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
            <StyledSelect
              className="w-full"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              options={startTimeOptions}
              placeholder={loadingAvailability ? "Loading available times..." : "Select start time"}
              disabled={!form.resourceId || !form.date || loadingAvailability || startTimeOptions.length === 0}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
            <StyledSelect
              className="w-full"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              options={endTimeOptions}
              placeholder="Select end time"
              disabled={!form.startTime || endTimeOptions.length === 0}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Duration must be between 30 minutes and 4 hours.</p>
            {form.resourceId && form.date && !loadingAvailability && startTimeOptions.length === 0 && (
              <p className="mt-1 text-xs text-rose-600">No available times for this resource on the selected date.</p>
            )}
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
