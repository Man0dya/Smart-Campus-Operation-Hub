import { useState } from "react";
import { createBooking } from "../services/bookingApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import FloatingToast from "../components/common/FloatingToast";

const initialForm = {
  resourceId: "",
  date: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: "",
};

function CreateBookingPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource ID</label>
            <input
              className="field"
              name="resourceId"
              value={form.resourceId}
              onChange={handleChange}
              placeholder="e.g., room-lab-204"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input className="field" name="date" type="date" value={form.date} onChange={handleChange} required />
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
