import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import AuthContext from "../context/auth-context";
import { getAllBookings } from "../services/bookingApi";
import { getAllTickets } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
  HiOutlineInboxStack,
  HiOutlineUserGroup,
  HiOutlineRectangleGroup,
  HiOutlineHome,
  HiOutlineBell,
  HiArrowRight,
  HiOutlineChartPie
} from "react-icons/hi2";

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
      tone: "bg-amber-50 text-amber-700 border-amber-100",
      gradient: "from-amber-50 to-white hover:border-amber-300",
      icon: HiOutlineClipboardDocumentList
    },
    {
      to: "/admin/tickets",
      title: "Ticket Command Center",
      desc: "Track all incident tickets and update their workflow status.",
      tone: "bg-cyan-50 text-cyan-700 border-cyan-100",
      gradient: "from-cyan-50 to-white hover:border-cyan-300",
      icon: HiOutlineWrenchScrewdriver
    },
    {
      to: "/admin/resources",
      title: "Resource Management",
      desc: "Create, edit, and remove campus resources.",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      gradient: "from-emerald-50 to-white hover:border-emerald-300",
      icon: HiOutlineInboxStack
    },
    {
      to: "/admin/users",
      title: "User Role Access",
      desc: "Assign USER, TECHNICIAN, or ADMIN roles for platform access.",
      tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
      gradient: "from-fuchsia-50 to-white hover:border-fuchsia-300",
      icon: HiOutlineUserGroup
    },
    {
      to: "/resources",
      title: "Live Resource Catalogue",
      desc: "Audit what users can currently discover and book.",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      gradient: "from-slate-50 to-white hover:border-slate-300",
      icon: HiOutlineRectangleGroup
    },
    {
      to: "/dashboard",
      title: "Standard Dashboard",
      desc: "Quickly switch into user-level experience validation.",
      tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
      gradient: "from-indigo-50 to-white hover:border-indigo-300",
      icon: HiOutlineHome
    }
  ];

  return (
    <AuthenticatedLayout
      title="Admin Control Center"
      subtitle="Unified access to every management workflow in Smart Campus Hub"
    >
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between w-full">
           <div>
             <h2 className="text-xl font-bold text-indigo-900">
               Welcome back, Admin {user?.name}
             </h2>
             <p className="mt-1 text-sm text-indigo-800">
               You currently have platform-wide administrator privileges
             </p>
           </div>
           <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <HiOutlineChartPie className="w-6 h-6" />
           </div>
        </div>
      </div>

      {error && <p className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</p>}

      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Platform Overview</h3>
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 hover:transform">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bookings</p>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {summary.bookingsPending} Pending
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-slate-900 leading-none">{summary.bookingsTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tickets</p>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                {summary.ticketsOpen} Open
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-slate-900 leading-none">{summary.ticketsTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resources</p>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {summary.resourcesActive} Active
              </span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-4xl font-black text-slate-900 leading-none">{summary.resourcesTotal}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">total</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Management Modules</h3>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.to}
              className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-b ${item.gradient} p-6 shadow-sm transition-all hover:-translate-y-1`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${item.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-slate-800 object-cover">{item.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600 opacity-90">{item.desc}</p>
              <div className="mt-auto flex items-center font-medium text-slate-700 opacity-80 transition-opacity group-hover:opacity-100 text-sm">
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
