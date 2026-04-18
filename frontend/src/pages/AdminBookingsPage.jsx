import { useCallback, useEffect, useState } from "react";
import {
  approveBooking,
  getAllBookings,
  rejectBooking,
  cancelBooking,
} from "../services/bookingApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineNoSymbol,
} from "react-icons/hi2";

const getBookingStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (["APPROVED", "CONFIRMED"].includes(normalized)) {
    return "chip-success";
  }
  if (["PENDING", "IN_PROGRESS"].includes(normalized)) {
    return "chip-warning";
  }
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "chip-danger";
  }
  if (["OPEN", "NEW"].includes(normalized)) {
    return "chip-info";
  }

  return "chip-neutral";
};

const getLockedAction = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "APPROVED") {
    return "approve";
  }
  if (normalized === "REJECTED") {
    return "reject";
  }
  if (["CANCELLED", "CANCELED"].includes(normalized)) {
    return "cancel";
  }

  return "";
};

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
      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <section className="panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Resource</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Reason</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/80">
                  {(() => {
                    const lockedAction = getLockedAction(booking.status);
                    const isFinalized = lockedAction !== "";

                    return (
                      <>
                  <td className="px-4 py-3 font-semibold text-slate-900">{booking.resourceId}</td>
                  <td className="px-4 py-3 text-slate-700">{booking.userId}</td>
                  <td className="px-4 py-3 text-slate-700">{booking.date}</td>
                  <td className="px-4 py-3 text-slate-700">{booking.startTime} - {booking.endTime}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getBookingStatusClass(booking.status)}`}>{booking.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{booking.adminReason || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={isFinalized && lockedAction !== "approve"}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          lockedAction === "approve"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                        } ${(isFinalized && lockedAction !== "approve") ? "cursor-not-allowed opacity-40" : ""}`}
                        title="Approve"
                        aria-label="Approve"
                        onClick={() => handleApprove(booking.id)}
                      >
                        <HiOutlineCheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={isFinalized && lockedAction !== "reject"}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          lockedAction === "reject"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                        } ${(isFinalized && lockedAction !== "reject") ? "cursor-not-allowed opacity-40" : ""}`}
                        title="Reject"
                        aria-label="Reject"
                        onClick={() => handleReject(booking.id)}
                      >
                        <HiOutlineXCircle className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={isFinalized && lockedAction !== "cancel"}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          lockedAction === "cancel"
                            ? "border-slate-400 bg-slate-200 text-slate-800"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        } ${(isFinalized && lockedAction !== "cancel") ? "cursor-not-allowed opacity-40" : ""}`}
                        title="Cancel"
                        aria-label="Cancel"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <HiOutlineNoSymbol className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="p-6 text-sm text-slate-600">No booking requests found.</div>
        )}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminBookingsPage;
