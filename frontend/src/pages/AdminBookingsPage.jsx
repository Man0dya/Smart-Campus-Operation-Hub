import { useCallback, useEffect, useState } from "react";
import {
  approveBooking,
  getAllBookings,
  rejectBooking,
  cancelBooking,
} from "../services/bookingApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      const res = await getAllBookings();
      setBookings(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load bookings. Admin role required.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadBookings]);

  const handleApprove = async (id) => {
    const reason = window.prompt("Optional approval note:", "Approved by admin") || undefined;
    try {
      await approveBooking(id, reason);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve booking.");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:", "") || "Rejected by admin";
    try {
      await rejectBooking(id, reason);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reject booking.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel booking.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Admin Booking Queue"
      subtitle="Approve, reject, and manage campus booking requests"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {bookings.length === 0 && (
          <div className="panel md:col-span-2 text-sm text-slate-600">No booking requests found.</div>
        )}

        {bookings.map((booking) => (
          <article key={booking.id} className="panel space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{booking.resourceId}</h3>
              <span className="chip">{booking.status}</span>
            </div>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">User:</span> {booking.userId}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Date:</span> {booking.date}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Time:</span> {booking.startTime} - {booking.endTime}</p>
            {booking.adminReason && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Reason:</span> {booking.adminReason}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button className="btn-primary" onClick={() => handleApprove(booking.id)}>
                Approve
              </button>
              <button className="btn-secondary" onClick={() => handleReject(booking.id)}>
                Reject
              </button>
              <button className="btn-secondary" onClick={() => handleCancel(booking.id)}>
                Cancel
              </button>
            </div>
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminBookingsPage;
