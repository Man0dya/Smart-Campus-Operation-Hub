import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelBooking, getMyBookings } from "../services/bookingApi";
import { getAllResources } from "../services/resourceApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";
import ConfirmDialog from "../components/common/ConfirmDialog";

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

  return "chip-neutral";
};

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [resourceNameById, setResourceNameById] = useState({});
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, bookingId: "" });

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

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await getAllResources();
        const resources = Array.isArray(res.data) ? res.data : [];
        const nextMap = resources.reduce((accumulator, resource) => {
          if (resource?.id) {
            accumulator[resource.id] = resource.name || resource.id;
          }
          return accumulator;
        }, {});
        setResourceNameById(nextMap);
      } catch {
        setResourceNameById({});
      }
    };

    void loadResources();
  }, []);

  const getResourceName = useCallback(
    (resourceId) => resourceNameById[resourceId] || resourceId || "Unknown Resource",
    [resourceNameById]
  );

  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel booking.");
    }
  };

  const openCancelDialog = (bookingId) => {
    setConfirmDialog({ open: true, bookingId });
  };

  const closeCancelDialog = () => {
    setConfirmDialog({ open: false, bookingId: "" });
  };

  const handleConfirmCancel = async () => {
    const bookingId = confirmDialog.bookingId;
    closeCancelDialog();

    if (!bookingId) {
      return;
    }

    await handleCancel(bookingId);
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
        getResourceName(booking.resourceId),
        booking.resourceId,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking.purpose,
        booking.status,
        booking.adminReason,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(query);
    });
  }, [bookings, searchQuery, statusFilter, getResourceName]);

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
      title="My Bookings"
      subtitle="Track booking status and manage upcoming reservations"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="panel mb-5 flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search by resource, date, purpose"
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

      <section className="grid gap-4 md:grid-cols-2">
        {filteredBookings.length === 0 && (
          <div className="panel md:col-span-2 text-sm text-slate-600">No bookings found yet.</div>
        )}

        {paginatedBookings.map((booking) => (
          <article key={booking.id} className="panel space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{getResourceName(booking.resourceId)}</h3>
              <span className={`chip ${getBookingStatusClass(booking.status)}`}>
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

            {booking.status && ["PENDING", "APPROVED"].includes(String(booking.status).toUpperCase()) && (
              <button className="btn-secondary" onClick={() => openCancelDialog(booking.id)}>
                Cancel Booking
              </button>
            )}
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Cancel Booking?"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
        onCancel={closeCancelDialog}
        onConfirm={handleConfirmCancel}
      />

      {filteredBookings.length > 0 && (
        <section className="panel mt-4 p-0">
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredBookings.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </section>
      )}
    </AuthenticatedLayout>
  );
}

export default MyBookingsPage;
