import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { getAllTickets, updateTicketStatus } from "../services/ticketApi";

function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === "ALL") {
      return tickets;
    }
    return tickets.filter((item) => item.status === statusFilter);
  }, [tickets, statusFilter]);

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

  const handleUpdate = async (ticketId) => {
    const draft = drafts[ticketId];
    if (!draft?.status) {
      setError("Select a status before updating.");
      return;
    }

    try {
      await updateTicketStatus(ticketId, {
        status: draft.status,
        assignedTo: draft.assignedTo || undefined,
        resolutionNotes: draft.resolutionNotes || undefined,
      });
      setMessage(`Ticket ${ticketId} updated.`);
      setError("");
      await loadTickets();
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || "Failed to update ticket.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Admin Ticket Command Center"
      subtitle="Monitor all incident tickets and control lifecycle status"
    >
      <section className="mb-5 panel flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Filter by status</label>
        <select className="field w-56" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">ALL</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </section>

      {message && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredTickets.length === 0 && (
          <div className="panel xl:col-span-2 text-sm text-slate-600">No tickets found for this filter.</div>
        )}

        {filteredTickets.map((ticket) => (
          <article key={ticket.id} className="panel space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ticket #{ticket.id}</h3>
                <p className="text-sm text-slate-600">Reported by: {ticket.reportedBy || "Unknown"}</p>
              </div>
              <span className="chip">{ticket.status}</span>
            </div>

            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Priority:</span> {ticket.priority}</p>
            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Category:</span> {ticket.category || "N/A"}</p>
            <p className="text-sm text-slate-600">{ticket.description}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="field"
                value={drafts[ticket.id]?.status || ticket.status || "OPEN"}
                onChange={(e) => setDraft(ticket.id, "status", e.target.value)}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <input
                className="field"
                placeholder="Assigned to"
                value={drafts[ticket.id]?.assignedTo || ""}
                onChange={(e) => setDraft(ticket.id, "assignedTo", e.target.value)}
              />

              <textarea
                className="field min-h-24 sm:col-span-2"
                placeholder="Resolution notes"
                value={drafts[ticket.id]?.resolutionNotes || ""}
                onChange={(e) => setDraft(ticket.id, "resolutionNotes", e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => handleUpdate(ticket.id)}>Update Status</button>
              <Link className="btn-secondary" to={`/tickets/${ticket.id}`}>Open Ticket Thread</Link>
            </div>
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminTicketsPage;
