import { useCallback, useEffect, useState } from "react";
import { cancelBooking, getMyBookings } from "../services/bookingApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load your bookings.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadBookings]);

  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel booking.");
    }
  };

  return (
    <AuthenticatedLayout
      title="My Bookings"
      subtitle="Track booking status and manage upcoming reservations"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {bookings.length === 0 && (
          <div className="panel md:col-span-2 text-sm text-slate-600">No bookings found yet.</div>
        )}

        {bookings.map((booking) => (
          <article key={booking.id} className="panel space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{booking.resourceId}</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  booking.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : booking.status === "PENDING"
                    ? "bg-amber-100 text-amber-700"
                    : booking.status === "REJECTED"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Date:</span> {booking.date}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Time:</span> {booking.startTime} - {booking.endTime}</p>
            {booking.purpose && (
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Purpose:</span> {booking.purpose}</p>
            )}
            {booking.adminReason && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Admin Note:</span> {booking.adminReason}
              </p>
            )}

            {booking.status !== "CANCELLED" && (
              <button className="btn-secondary" onClick={() => handleCancel(booking.id)}>
                Cancel Booking
              </button>
            )}
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default MyBookingsPage;
