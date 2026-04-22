import { useCallback, useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import ConfirmDialog from "../components/common/ConfirmDialog";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";
import { cancelTicket, getMyTickets } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";

const getTicketStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (["RESOLVED", "CLOSED"].includes(normalized)) {
    return "chip-success";
  }
  if (["OPEN", "IN_PROGRESS", "PENDING"].includes(normalized)) {
    return "chip-warning";
  }
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "chip-danger";
  }

  return "chip-neutral";
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  try {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
};

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [resourceNameById, setResourceNameById] = useState({});
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, ticketId: "" });

  const loadTickets = useCallback(async () => {
    try {
      const res = await getMyTickets();
      setTickets(res.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load your tickets.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTickets]);

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

  const handleCancel = async (ticketId) => {
    try {
      await cancelTicket(ticketId);
      await loadTickets();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel ticket.");
    }
  };

  const openCancelDialog = (ticketId) => {
    setConfirmDialog({ open: true, ticketId });
  };

  const closeCancelDialog = () => {
    setConfirmDialog({ open: false, ticketId: "" });
  };

  const handleConfirmCancel = async () => {
    const ticketId = confirmDialog.ticketId;
    closeCancelDialog();

    if (!ticketId) {
      return;
    }

    await handleCancel(ticketId);
  };

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const ticketStatus = String(ticket.status || "").toUpperCase();
      const matchesStatus = statusFilter === "ALL" || ticketStatus === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const haystack = [
        ticket.id,
        getResourceName(ticket.resourceId),
        ticket.resourceId,
        ticket.category,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.createdAt,
        ticket.updatedAt,
        ticket.assignedTo,
        ticket.resolutionNotes,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(query);
    });
  }, [tickets, searchQuery, statusFilter, getResourceName]);

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(filteredTickets.length / pageSize)),
    [filteredTickets.length, pageSize]
  );

  const currentPage = Math.min(page, maxPage);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    const clamped = Math.max(1, Math.min(Number(nextPage) || 1, maxPage));
    setPage(clamped);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(1);
  };

  return (
    <AuthenticatedLayout title="My Tickets" subtitle="Track ticket status and cancel reports when needed">
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="panel mb-5 flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search by resource, category, priority"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <StyledSelect
          name="statusFilter"
          className="w-52"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "OPEN", label: "OPEN" },
            { value: "IN_PROGRESS", label: "IN_PROGRESS" },
            { value: "RESOLVED", label: "RESOLVED" },
            { value: "CLOSED", label: "CLOSED" },
            { value: "REJECTED", label: "REJECTED" },
            { value: "CANCELLED", label: "CANCELLED" },
          ]}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filteredTickets.length === 0 && (
          <div className="panel md:col-span-2 text-sm text-slate-600">No tickets found yet.</div>
        )}

        {paginatedTickets.map((ticket) => {
          const statusNormalized = String(ticket.status || "").toUpperCase();
          const canCancel = statusNormalized === "OPEN";

          return (
            <article key={ticket.id} className="panel space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">{getResourceName(ticket.resourceId)}</h3>
                <span className={`chip ${getTicketStatusClass(ticket.status)}`}>{ticket.status}</span>
              </div>

              {ticket.category && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Category:</span> {ticket.category}
                </p>
              )}
              {ticket.priority && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Priority:</span> {ticket.priority}
                </p>
              )}
              {ticket.createdAt && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Created:</span> {formatTimestamp(ticket.createdAt)}
                </p>
              )}
              {ticket.description && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Description:</span> {ticket.description}
                </p>
              )}
              {ticket.resolutionNotes && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Notes:</span> {ticket.resolutionNotes}
                </p>
              )}

              {canCancel && (
                <button className="btn-secondary" onClick={() => openCancelDialog(ticket.id)}>
                  Cancel Ticket
                </button>
              )}
            </article>
          );
        })}
      </section>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Cancel Ticket?"
        description="Are you sure you want to cancel this ticket? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Ticket"
        onCancel={closeCancelDialog}
        onConfirm={handleConfirmCancel}
      />

      {filteredTickets.length > 0 && (
        <section className="panel mt-4 p-0">
          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            totalItems={filteredTickets.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </section>
      )}
    </AuthenticatedLayout>
  );
}

export default MyTicketsPage;
