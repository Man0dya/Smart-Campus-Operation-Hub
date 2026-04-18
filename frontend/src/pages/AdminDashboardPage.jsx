import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { getAllBookings } from "../services/bookingApi";
import { getAllTickets } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
  HiOutlineInboxStack,
  HiOutlineUserGroup,
  HiOutlineRectangleGroup,
  HiArrowRight
} from "react-icons/hi2";

function AdminDashboardPage() {
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
      tag: "Queue",
      icon: HiOutlineClipboardDocumentList
    },
    {
      to: "/admin/tickets",
      title: "Ticket Command Center",
      desc: "Track all incident tickets and update their workflow status.",
      tag: "Support",
      icon: HiOutlineWrenchScrewdriver
    },
    {
      to: "/admin/resources",
      title: "Resource Management",
      desc: "Create, edit, and remove campus resources.",
      tag: "Inventory",
      icon: HiOutlineInboxStack
    },
    {
      to: "/admin/users",
      title: "User Role Access",
      desc: "Assign USER, TECHNICIAN, or ADMIN roles for platform access.",
      tag: "Security",
      icon: HiOutlineUserGroup
    },
    {
      to: "/resources",
      title: "Live Resource Catalogue",
      desc: "Audit what users can currently discover and book.",
      tag: "Preview",
      icon: HiOutlineRectangleGroup
    }
  ];

  return (
    <AuthenticatedLayout
      title="Admin Control Center"
      subtitle="Unified access to every management workflow in Smart Campus Hub"
    >
      {error && <p className="status-error mb-6 rounded-xl px-4 py-3 text-sm shadow-sm">{error}</p>}

      <div className="fade-up stagger-1 mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Platform Overview</h3>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="panel card-lift fade-up relative overflow-hidden p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bookings</p>
              <span className="chip chip-warning">
                {summary.bookingsPending} Pending
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black leading-none text-slate-900">{summary.bookingsTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>

          <div className="panel card-lift fade-up stagger-2 relative overflow-hidden p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tickets</p>
              <span className="chip chip-warning">
                {summary.ticketsOpen} Open
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black leading-none text-slate-900">{summary.ticketsTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>

          <div className="panel card-lift fade-up stagger-3 relative overflow-hidden p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resources</p>
              <span className="chip chip-success">
                {summary.resourcesActive} Active
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black leading-none text-slate-900">{summary.resourcesTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Management Modules</h3>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.to}
              className={`panel card-lift fade-up group relative flex flex-col p-5 stagger-${Math.min(index + 1, 4)}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.tag}</span>
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              <div className="mt-auto flex items-center text-sm font-medium text-slate-700 opacity-80 transition-opacity group-hover:opacity-100">
                Manage <HiArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </section>
    </AuthenticatedLayout>
  );
}

export default AdminDashboardPage;
