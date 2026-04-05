import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import AuthContext from "../context/auth-context";
import { getAllBookings } from "../services/bookingApi";
import { getAllTickets } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";

function AdminDashboardPage() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    bookingsTotal: 0,
    bookingsPending: 0,
    ticketsTotal: 0,
    ticketsOpen: 0,
    resourcesTotal: 0,
    resourcesActive: 0,
  });
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const [bookingsRes, ticketsRes, resourcesRes] = await Promise.all([
        getAllBookings(),
        getAllTickets(),
        getAllResources(),
      ]);

      const bookings = bookingsRes.data || [];
      const tickets = ticketsRes.data || [];
      const resources = resourcesRes.data || [];

      setSummary({
        bookingsTotal: bookings.length,
        bookingsPending: bookings.filter((item) => item.status === "PENDING").length,
        ticketsTotal: tickets.length,
        ticketsOpen: tickets.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length,
        resourcesTotal: resources.length,
        resourcesActive: resources.filter((item) => item.status === "ACTIVE").length,
      });
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load admin summary.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSummary]);

  const links = [
    {
      to: "/bookings/admin",
      title: "Booking Moderation",
      desc: "Approve, reject, and cancel booking requests.",
      tone: "bg-amber-50 border-amber-200 text-amber-900",
    },
    {
      to: "/admin/tickets",
      title: "Ticket Command Center",
      desc: "Track all incident tickets and update their workflow status.",
      tone: "bg-cyan-50 border-cyan-200 text-cyan-900",
    },
    {
      to: "/admin/resources",
      title: "Resource Management",
      desc: "Create, edit, and remove campus resources.",
      tone: "bg-emerald-50 border-emerald-200 text-emerald-900",
    },
    {
      to: "/admin/users",
      title: "User & Role Access",
      desc: "Assign USER, TECHNICIAN, or ADMIN roles for dashboard access.",
      tone: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
    },
    {
      to: "/resources",
      title: "Live Resource Catalogue",
      desc: "Audit what users can currently discover and book.",
      tone: "bg-slate-50 border-slate-200 text-slate-900",
    },
    {
      to: "/dashboard",
      title: "Standard User Dashboard",
      desc: "Quickly switch into user-level experience validation.",
      tone: "bg-white border-slate-200 text-slate-900",
    },
    {
      to: "/notifications",
      title: "Notifications",
      desc: "Review your own workflow updates and alerts.",
      tone: "bg-white border-slate-200 text-slate-900",
    },
  ];

  return (
    <AuthenticatedLayout
      title="Admin Control Center"
      subtitle="Unified access to every management workflow in Smart Campus Hub"
    >
      <section className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm text-indigo-900">
          Signed in as <span className="font-semibold">{user?.name || "Admin"}</span>.
          You currently have platform-wide administrator privileges.
        </p>
      </section>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bookings</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{summary.bookingsTotal}</h3>
          <p className="mt-1 text-sm text-slate-600">Total requests</p>
          <p className="mt-2 text-sm text-amber-700">Pending: {summary.bookingsPending}</p>
        </article>
        <article className="panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tickets</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{summary.ticketsTotal}</h3>
          <p className="mt-1 text-sm text-slate-600">Total incidents</p>
          <p className="mt-2 text-sm text-cyan-700">Open or In Progress: {summary.ticketsOpen}</p>
        </article>
        <article className="panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resources</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{summary.resourcesTotal}</h3>
          <p className="mt-1 text-sm text-slate-600">Total listed resources</p>
          <p className="mt-2 text-sm text-emerald-700">Active: {summary.resourcesActive}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className={`panel block transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}
          >
            <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
            <p className="text-sm opacity-90">{item.desc}</p>
          </Link>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminDashboardPage;
