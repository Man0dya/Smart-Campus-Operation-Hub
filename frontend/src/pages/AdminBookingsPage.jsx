import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveBooking,
  getAllBookings,
  rejectBooking,
  cancelBooking,
  deleteAdminBooking,
} from "../services/bookingApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineNoSymbol,
  HiOutlineTrash,
} from "react-icons/hi2";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FloatingToast from "../components/common/FloatingToast";

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
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: "",
    bookingId: "",
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    inputLabel: "",
    inputPlaceholder: "",
    inputDefaultValue: "",
    inputRequired: false,
    inputMaxLength: undefined,
    multilineInput: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

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

  const approveBookingAction = async (id, reason) => {
    try {
      await approveBooking(id, reason);
      showToast("Booking approved.");
      setError("");
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve booking.");
    }
  };

  const rejectBookingAction = async (id, reason) => {
    try {
      await rejectBooking(id, reason);
      showToast("Booking rejected.");
      setError("");
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reject booking.");
    }
  };

  const cancelBookingAction = async (id) => {
    try {
      await cancelBooking(id);
      showToast("Booking cancelled.");
      setError("");
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel booking.");
    }
  };

  const deleteBookingAction = async (id) => {
    try {
      await deleteAdminBooking(id);
      showToast("Booking deleted.");
      setError("");
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete booking.");
    }
  };

  const submitConfirmation = async (inputValue) => {
    const { action, bookingId } = confirmDialog;
    closeConfirmDialog();

    if (!bookingId || !action) {
      return;
    }

    if (action === "approve") {
      await approveBookingAction(bookingId, inputValue || undefined);
      return;
    }

    if (action === "reject") {
      await rejectBookingAction(bookingId, inputValue || "Rejected by admin");
      return;
    }

    if (action === "cancel") {
      await cancelBookingAction(bookingId);
      return;
    }

    if (action === "delete") {
      await deleteBookingAction(bookingId);
    }
  };

  const openApproveDialog = (bookingId) => {
    setConfirmDialog({
      open: true,
      action: "approve",
      bookingId,
      title: "Approve booking?",
      description: "This booking will be moved to APPROVED status.",
      confirmText: "Approve",
      variant: "neutral",
      inputLabel: "Approval note (optional)",
      inputPlaceholder: "Approved by admin",
      inputDefaultValue: "Approved by admin",
      inputRequired: false,
      inputMaxLength: 300,
      multilineInput: false,
    });
  };

  const openRejectDialog = (bookingId) => {
    setConfirmDialog({
      open: true,
      action: "reject",
      bookingId,
      title: "Reject booking?",
      description: "Rejection reason will be saved and shown to the user.",
      confirmText: "Reject",
      variant: "danger",
      inputLabel: "Rejection reason",
      inputPlaceholder: "Enter a clear reason",
      inputDefaultValue: "",
      inputRequired: true,
      inputMaxLength: 300,
      multilineInput: true,
    });
  };

  const openCancelDialog = (bookingId) => {
    setConfirmDialog({
      open: true,
      action: "cancel",
      bookingId,
      title: "Cancel booking?",
      description: "This will change booking status to CANCELLED.",
      confirmText: "Cancel Booking",
      variant: "neutral",
      inputLabel: "",
      inputPlaceholder: "",
      inputDefaultValue: "",
      inputRequired: false,
      inputMaxLength: undefined,
      multilineInput: false,
    });
  };

  const openDeleteDialog = (bookingId) => {
    setConfirmDialog({
      open: true,
      action: "delete",
      bookingId,
      title: "Delete booking?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      inputLabel: "",
      inputPlaceholder: "",
      inputDefaultValue: "",
      inputRequired: false,
      inputMaxLength: undefined,
      multilineInput: false,
    });
  };

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "ALL" || String(booking.status || "").toUpperCase() === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const haystack = [
        booking.resourceId,
        booking.userId,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking.status,
        booking.adminReason,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(query);
    });
  }, [bookings, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredBookings.length, page, pageSize]);

  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, page, pageSize]);

  return (
    <AuthenticatedLayout
      title="Admin Booking Queue"
      subtitle="Approve, reject, and manage campus booking requests"
    >
      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <section className="panel mb-5 flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search by resource, user, date, status"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <StyledSelect
          name="statusFilter"
          className="w-52"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "PENDING", label: "PENDING" },
            { value: "APPROVED", label: "APPROVED" },
            { value: "REJECTED", label: "REJECTED" },
            { value: "CANCELLED", label: "CANCELLED" },
          ]}
        />
      </section>

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
              {paginatedBookings.map((booking) => (
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
                        onClick={() => openApproveDialog(booking.id)}
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
                        onClick={() => openRejectDialog(booking.id)}
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
                        onClick={() => openCancelDialog(booking.id)}
                      >
                        <HiOutlineNoSymbol className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                        title="Delete booking"
                        aria-label="Delete booking"
                        onClick={() => openDeleteDialog(booking.id)}
                      >
                        <HiOutlineTrash className="h-5 w-5" />
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

        {filteredBookings.length === 0 && (
          <div className="p-6 text-sm text-slate-600">No booking requests found for these filters.</div>
        )}

        {filteredBookings.length > 0 && (
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredBookings.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        inputLabel={confirmDialog.inputLabel}
        inputPlaceholder={confirmDialog.inputPlaceholder}
        inputDefaultValue={confirmDialog.inputDefaultValue}
        inputRequired={confirmDialog.inputRequired}
        inputMaxLength={confirmDialog.inputMaxLength}
        multilineInput={confirmDialog.multilineInput}
        onCancel={closeConfirmDialog}
        onConfirm={(inputValue) => void submitConfirmation(inputValue)}
      />

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default AdminBookingsPage;
