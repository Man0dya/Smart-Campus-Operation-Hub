import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { deleteAdminTicket, getAllTickets, updateTicketStatus, getAvailableTechnicians } from "../services/ticketApi";
import {
  HiOutlinePencilSquare,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineTrash,
} from "react-icons/hi2";
import PaginationControls from "../components/common/PaginationControls";
import StyledSelect from "../components/common/StyledSelect";
import AuthContext from "../context/auth-context";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FloatingToast from "../components/common/FloatingToast";

const getTicketStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (["RESOLVED", "CLOSED"].includes(normalized)) {
    return "chip-success";
  }
  if (["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING"].includes(normalized)) {
    return "chip-warning";
  }
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "chip-danger";
  }

  return "chip-neutral";
};

function AdminTicketsPage() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    ticketId: "",
  });
  const [drafts, setDrafts] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formErrors, setFormErrors] = useState({});

  // Available technicians for assignment dropdown
  const [availableTechnicians, setAvailableTechnicians] = useState([]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await getAllTickets();
      const all = res.data || [];
      setTickets(all);
      setDrafts((prev) => {
        const next = { ...prev };
        all.forEach((ticket) => {
          if (!next[ticket.id]) {
            next[ticket.id] = {
              status: ticket.status || "OPEN",
              assignedTo: ticket.assignedTo || "",
              resolutionNotes: ticket.resolutionNotes || "",
            };
          }
        });
        return next;
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load tickets.");
    }
  }, []);

  const loadTechnicians = useCallback(async (category) => {
    // Only admin can fetch available technicians
    if (user?.role !== "ADMIN") return;
    try {
      const res = await getAvailableTechnicians(category);
      setAvailableTechnicians(res.data || []);
    } catch {
      // Non-critical, silently fail
    }
  }, [user?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTickets();
      void loadTechnicians();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTickets, loadTechnicians]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || item.priority === priorityFilter;

      if (!query) {
        return matchesStatus && matchesPriority;
      }

      const haystack = [
        item.id,
        item.description,
        item.reportedBy,
        item.assignedTo,
        item.category,
        item.priority,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesPriority && haystack.includes(query);
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, searchQuery, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredTickets.length, page, pageSize]);

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  const setDraft = (ticketId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [ticketId]: {
        ...(prev[ticketId] || {
          status: "OPEN",
          assignedTo: "",
          resolutionNotes: "",
        }),
        [key]: value,
      },
    }));
  };

  const openEditor = (ticketId) => {
    setActiveTicketId(ticketId);
    setDrawerOpen(true);
    setFormErrors({});
    // Refresh available technicians for this ticket's category
    const ticket = tickets.find(t => t.id === ticketId);
    void loadTechnicians(ticket?.category);
  };

  const closeEditor = () => {
    setDrawerOpen(false);
    setFormErrors({});
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, ticketId: "" });
  };

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const handleUpdate = async () => {
    const draft = drafts[activeTicketId];
    if (!draft?.status) {
      setError("Select a status before updating.");
      return;
    }

    const errors = {};
    if (draft?.resolutionNotes && draft.resolutionNotes.trim().length > 1500) {
      errors.resolutionNotes = "Resolution notes must be less than 1500 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      await updateTicketStatus(activeTicketId, {
        status: draft.status,
        assignedTo: draft.assignedTo || undefined,
        resolutionNotes: draft.resolutionNotes ? draft.resolutionNotes.trim() : undefined,
      });
      showToast(`Ticket ${activeTicketId} updated.`);
      setError("");
      setDrawerOpen(false);
      await loadTickets();
      // Refresh technician list after assignment
      await loadTechnicians();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update ticket.");
    }
  };

  const deleteTicketAction = async (ticketId) => {
    try {
      await deleteAdminTicket(ticketId);
      showToast(`Ticket ${ticketId} deleted.`);
      setError("");

      if (activeTicketId === ticketId) {
        setDrawerOpen(false);
      }

      await loadTickets();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete ticket.");
    }
  };

  const openDeleteDialog = (ticketId) => {
    setConfirmDialog({
      open: true,
      ticketId,
    });
  };

  const handleConfirmDelete = async () => {
    const ticketId = confirmDialog.ticketId;
    closeConfirmDialog();
    if (!ticketId) {
      return;
    }
    await deleteTicketAction(ticketId);
  };

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId),
    [tickets, activeTicketId]
  );

  // Build technician dropdown options
  const technicianOptions = useMemo(() => {
    const options = [{ value: "", label: "— Select Technician —" }];

    availableTechnicians.forEach((tech) => {
      const label = tech.name
        ? `${tech.name} (${tech.email || "no email"})`
        : tech.email || tech.id;
      options.push({ value: tech.id, label });
    });

    // If the ticket already has an assigned tech who is NOT in the available list,
    // keep them as an option so the dropdown shows the current value
    const currentAssigned = drafts[activeTicketId]?.assignedTo;
    if (currentAssigned && !availableTechnicians.some((t) => t.id === currentAssigned)) {
      options.push({ value: currentAssigned, label: `${currentAssigned} (currently assigned)` });
    }

    return options;
  }, [availableTechnicians, activeTicketId, drafts]);

  return (
    <AuthenticatedLayout
      title="Admin Ticket Command Center"
      subtitle="Monitor all incident tickets and control lifecycle status"
    >
      <section className="mb-5 panel flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search by id, description, reporter, assignee"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <label className="text-sm font-medium text-slate-700">Filter by status</label>
        <StyledSelect
          name="statusFilter"
          className="w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "ALL", label: "ALL" },
            { value: "OPEN", label: "OPEN" },
            { value: "ASSIGNED", label: "ASSIGNED" },
            { value: "IN_PROGRESS", label: "IN_PROGRESS" },
            { value: "RESOLVED", label: "RESOLVED" },
            { value: "CLOSED", label: "CLOSED" },
            { value: "REJECTED", label: "REJECTED" },
          ]}
        />
        <label className="text-sm font-medium text-slate-700">Priority</label>
        <StyledSelect
          name="priorityFilter"
          className="w-48"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: "ALL", label: "ALL" },
            { value: "LOW", label: "LOW" },
            { value: "MEDIUM", label: "MEDIUM" },
            { value: "HIGH", label: "HIGH" },
            { value: "CRITICAL", label: "CRITICAL" },
          ]}
        />
      </section>

      {error && <p className="status-error mb-4 rounded-xl px-4 py-3 text-sm">{error}</p>}

      <section className="panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ticket</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Reporter</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Assigned</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">#{ticket.id}</p>
                    <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{ticket.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ticket.reportedBy || "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-700">{ticket.priority || "N/A"}</td>
                  <td className="px-4 py-3 text-slate-700">{ticket.category || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${getTicketStatusClass(ticket.status)}`}>{ticket.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ticket.assignedTo || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Manage ticket"
                        aria-label="Manage ticket"
                        onClick={() => openEditor(ticket.id)}
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </button>
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Open ticket thread"
                        aria-label="Open ticket thread"
                        to={`/tickets/${ticket.id}`}
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </Link>
                      {user?.role === "ADMIN" && (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Delete ticket"
                          aria-label="Delete ticket"
                          onClick={() => openDeleteDialog(ticket.id)}
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-6 text-sm text-slate-600">No tickets found for this filter.</div>
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

      <div
        className={`fixed inset-0 z-[70] bg-slate-950/50 transition-opacity duration-250 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeEditor}
      />
      <aside
        className={`fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manage Ticket</h2>
            <p className="text-sm text-slate-500">#{activeTicket?.id || "-"}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={closeEditor}
            aria-label="Close panel"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <StyledSelect
              name="status"
              value={drafts[activeTicketId]?.status || activeTicket?.status || "OPEN"}
              onChange={(e) => setDraft(activeTicketId, "status", e.target.value)}
              options={[
                { value: "OPEN", label: "OPEN" },
                { value: "ASSIGNED", label: "ASSIGNED" },
                { value: "IN_PROGRESS", label: "IN_PROGRESS" },
                { value: "RESOLVED", label: "RESOLVED" },
                { value: "CLOSED", label: "CLOSED" },
                { value: "REJECTED", label: "REJECTED" },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Assign Technician
              {availableTechnicians.length > 0 && (
                <span className="ml-2 text-xs font-normal text-emerald-600">
                  ({availableTechnicians.length} available)
                </span>
              )}
            </label>
            {user?.role === "ADMIN" ? (
              <StyledSelect
                name="assignedTo"
                value={drafts[activeTicketId]?.assignedTo || ""}
                onChange={(e) => setDraft(activeTicketId, "assignedTo", e.target.value)}
                options={technicianOptions}
              />
            ) : (
              <input
                className="field"
                placeholder="Assigned to"
                value={drafts[activeTicketId]?.assignedTo || ""}
                onChange={(e) => setDraft(activeTicketId, "assignedTo", e.target.value)}
                disabled
              />
            )}
            {user?.role === "ADMIN" && availableTechnicians.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No technicians are currently available. They may be assigned to other tickets.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resolution Notes</label>
            <textarea
              className={`field min-h-24 ${formErrors.resolutionNotes ? "border-rose-400 focus:border-rose-400" : ""}`}
              placeholder="Resolution notes"
              value={drafts[activeTicketId]?.resolutionNotes || ""}
              onChange={(e) => {
                setDraft(activeTicketId, "resolutionNotes", e.target.value);
                if (formErrors.resolutionNotes) setFormErrors({});
              }}
            />
            {formErrors.resolutionNotes && <p className="mt-1 text-xs text-rose-600">{formErrors.resolutionNotes}</p>}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={handleUpdate}>Update Ticket</button>
            <button className="btn-secondary" onClick={closeEditor}>Cancel</button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete ticket?"
        description="This action cannot be undone."
        confirmText="Delete"
        onCancel={closeConfirmDialog}
        onConfirm={() => void handleConfirmDelete()}
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

export default AdminTicketsPage;
