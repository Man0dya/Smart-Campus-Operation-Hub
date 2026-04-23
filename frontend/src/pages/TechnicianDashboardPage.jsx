import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { getAssignedTickets, updateTicketStatus } from "../services/ticketApi";
import { updateMyAvailability } from "../services/userApi";
import {
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineWrenchScrewdriver,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";
import AuthContext from "../context/auth-context";
import FloatingToast from "../components/common/FloatingToast";

const getTicketStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (["RESOLVED", "CLOSED"].includes(normalized)) return "chip-success";
  if (["OPEN", "IN_PROGRESS", "PENDING"].includes(normalized)) return "chip-warning";
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) return "chip-danger";
  return "chip-neutral";
};

const getPriorityClass = (priority) => {
  const p = String(priority || "").toUpperCase();
  if (p === "HIGH" || p === "CRITICAL") return "chip-danger";
  if (p === "MEDIUM") return "chip-warning";
  return "chip-neutral";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
};

function TechnicianDashboardPage() {
  const { user, setUser } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availabilityStatus, setAvailabilityStatus] = useState("AVAILABLE");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Resolve modal state
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: "" });
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  useEffect(() => {
    if (user?.role === "TECHNICIAN") {
      setAvailabilityStatus(user.availabilityStatus || "AVAILABLE");
      setAvailabilityNote(user.availabilityNote || "");
    }
  }, [user]);

  const handleSaveAvailability = async () => {
    if (!user || availabilityLoading) return;
    setAvailabilityLoading(true);
    setError("");

    try {
      const res = await updateMyAvailability({
        status: availabilityStatus,
        note: availabilityNote,
      });
      setUser(res.data);
      showToast(`Availability updated to ${res.data.availabilityStatus.replace(/_/g, " ")}.`, "success");
    } catch (err) {
      const message = err?.response?.data?.error || "Unable to update availability.";
      setError(message);
      showToast(message, "danger");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadTickets = useCallback(async () => {
    try {
      const res = await getAssignedTickets();
      setTickets(res.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load assigned tickets.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tickets.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      if (!query) return matchesStatus;
      const haystack = [item.id, item.description, item.category, item.priority, item.status]
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(query);
    });
  }, [tickets, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filteredTickets.length, page, pageSize]);

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolved = tickets.filter((t) => t.status === "CLOSED").length;
    const pending = tickets.filter((t) => t.status === "OPEN").length;
    return { total, inProgress, resolved, pending };
  }, [tickets]);

  const openResolveModal = (ticketId) => {
    setResolveModal({ open: true, ticketId });
    setResolutionNotes("");
  };

  const closeResolveModal = () => {
    setResolveModal({ open: false, ticketId: "" });
    setResolutionNotes("");
    setResolving(false);
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      setError("Please provide resolution notes before marking as done.");
      return;
    }

    setResolving(true);
    try {
      await updateTicketStatus(resolveModal.ticketId, {
        status: "CLOSED",
        resolutionNotes: resolutionNotes.trim(),
      });
      showToast(`Ticket #${resolveModal.ticketId} marked as done and closed.`);
      setError("");
      closeResolveModal();
      await loadTickets();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to close ticket.");
      setResolving(false);
    }
  };

  return (
    <AuthenticatedLayout
      title="Technician Service Desk"
      subtitle="View and resolve tickets assigned to you"
    >
      {/* Stats Overview */}
      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel flex items-center gap-3 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <HiOutlineWrenchScrewdriver className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Assigned</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <HiOutlineClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <HiOutlineCheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Done</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <HiOutlineExclamationTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-rose-600">{stats.pending}</p>
          </div>
        </div>
      </section>

      {user?.role === "TECHNICIAN" && (
        <section className="mb-5 panel rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-slate-900">Assignment Availability</p>
              <p className="mt-1 text-sm text-slate-600">
                Choose a current availability status and leave a short note for admins.
                Only technicians marked AVAILABLE are considered for new assignments.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <StyledSelect
                    name="availabilityStatus"
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    options={[
                      { value: "AVAILABLE", label: "Available" },
                      { value: "BUSY", label: "Busy" },
                      { value: "ON_LEAVE", label: "On Leave" },
                      { value: "UNAVAILABLE", label: "Unavailable" },
                    ]}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto"
                  onClick={handleSaveAvailability}
                  disabled={availabilityLoading}
                >
                  {availabilityLoading ? "Saving..." : "Save Availability"}
                </button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
                <textarea
                  className="field min-h-24"
                  value={availabilityNote}
                  onChange={(e) => setAvailabilityNote(e.target.value)}
                  placeholder='Add a note for admins (e.g. "On call, but no new tickets" or "Out for 2 hours")'
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {user.available ? "Available" : "Unavailable"}
                </span>
                {user.availabilityNote && (
                  <p className="text-xs text-slate-500">Note: {user.availabilityNote}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="mb-5 panel flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search by id, description, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <label className="text-sm font-medium text-slate-700">Status</label>
        <StyledSelect
          name="statusFilter"
          className="w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "ALL", label: "ALL" },
            { value: "IN_PROGRESS", label: "IN PROGRESS" },
            { value: "CLOSED", label: "DONE" },
          ]}
        />
      </section>

      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      {/* Ticket List */}
      <section className="panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Assigned</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">#{ticket.id}</p>
                    <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{ticket.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getPriorityClass(ticket.priority)}`}>{ticket.priority || "N/A"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ticket.category || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getTicketStatusClass(ticket.status)}`}>{ticket.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(ticket.statusChangedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {ticket.status === "IN_PROGRESS" && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-400"
                          title="Mark as Done"
                          onClick={() => openResolveModal(ticket.id)}
                        >
                          <HiOutlineCheckCircle className="h-4 w-4" />
                          Mark Done
                        </button>
                      )}
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Open ticket thread"
                        aria-label="Open ticket thread"
                        to={`/tickets/${ticket.id}`}
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center">
            <HiOutlineWrenchScrewdriver className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-600">No tickets assigned to you yet.</p>
            <p className="mt-1 text-xs text-slate-400">Tickets will appear here once an admin assigns them to you.</p>
          </div>
        )}

        {filteredTickets.length > 0 && (
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredTickets.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </section>

      {/* Resolve Modal Overlay */}
      <div
        className={`fixed inset-0 z-[70] bg-slate-950/50 transition-opacity duration-250 ${
          resolveModal.open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeResolveModal}
      />

      {/* Resolve Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-[80] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-300 ${
          resolveModal.open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mark Ticket as Done</h2>
            <p className="text-sm text-slate-500">#{resolveModal.ticketId}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={closeResolveModal}
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Resolution Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="field min-h-32"
              placeholder="Describe what was done to fix the issue, parts replaced, actions taken..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={5}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              className="btn-primary flex-1"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? "Closing..." : "Mark as Done"}
            </button>
            <button className="btn-secondary" onClick={closeResolveModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default TechnicianDashboardPage;
