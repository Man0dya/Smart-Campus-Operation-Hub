import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import { getAllBookings } from "../services/bookingApi";
import { getAllTickets } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";
import { getAllUsers } from "../services/adminUserApi";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
  HiOutlineInboxStack,
  HiOutlineUserGroup,
  HiOutlineRectangleGroup,
  HiArrowRight,
  HiOutlineArrowDownTray,
  HiOutlineChartBar
} from "react-icons/hi2";

function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    bookingsTotal: 0,
    bookingsPending: 0,
    ticketsTotal: 0,
    ticketsOpen: 0,
    resourcesTotal: 0,
    resourcesActive: 0,
    topResource: "N/A",
    peakHour: "N/A"
  });
  const [data, setData] = useState({
    bookings: [],
    tickets: [],
    resources: [],
    users: [],
  });
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const [bookingsRes, ticketsRes, resourcesRes, usersRes] = await Promise.all([
        getAllBookings(),
        getAllTickets(),
        getAllResources(),
        getAllUsers(),
      ]);

      const bookings = bookingsRes.data || [];
      const tickets = ticketsRes.data || [];
      const resources = resourcesRes.data || [];
      const users = usersRes.data || [];

      setData({ bookings, tickets, resources, users });

      // Compute top resource
      const resourceCounts = {};
      bookings.forEach(b => {
        if (b.resourceName) {
          resourceCounts[b.resourceName] = (resourceCounts[b.resourceName] || 0) + 1;
        }
      });
      const topRes = Object.entries(resourceCounts).sort((a, b) => b[1] - a[1])[0];

      // Compute peak booking hour
      const hourCounts = {};
      bookings.forEach(b => {
        if (b.startTime) {
          const d = new Date(b.startTime);
          const h = d.getHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
      });
      const peakHr = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      const peakHourFormatted = peakHr ? `${peakHr[0].padStart(2, '0')}:00` : "N/A";

      setSummary({
        bookingsTotal: bookings.length,
        bookingsPending: bookings.filter((item) => item.status === "PENDING").length,
        ticketsTotal: tickets.length,
        ticketsOpen: tickets.filter((item) => item.status === "OPEN" || item.status === "ASSIGNED" || item.status === "IN_PROGRESS").length,
        resourcesTotal: resources.length,
        resourcesActive: resources.filter((item) => item.status === "ACTIVE").length,
        topResource: topRes ? topRes[0] : "N/A",
        peakHour: peakHourFormatted
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

  const handleExport = (type, dataset) => {
    let rawData = [];
    let headers = [];
    let title = "";
    
    if (dataset === "users") {
      rawData = data.users;
      headers = ["id", "name", "email", "role"];
      title = "User Report";
    } else if (dataset === "tickets") {
      rawData = data.tickets;
      headers = ["id", "priority", "category", "status", "createdAt"];
      title = "Ticket Report";
    } else if (dataset === "bookings") {
      rawData = data.bookings;
      headers = ["id", "resourceName", "status", "startTime", "endTime"];
      title = "Booking Report";
    }

    if (type === "csv") {
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rawData.map(row => headers.map(h => `"${row[h] || ''}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${dataset}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "pdf") {
      const doc = new jsPDF();
      doc.text(title, 14, 15);
      const tableData = rawData.map(row => headers.map(h => String(row[h] || '')));
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 20,
      });
      doc.save(`${dataset}_report.pdf`);
    }
  };

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="panel card-lift fade-up relative overflow-hidden p-5 xl:col-span-1">
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

          <div className="panel card-lift fade-up stagger-2 relative overflow-hidden p-5 xl:col-span-1">
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

          <div className="panel card-lift fade-up stagger-3 relative overflow-hidden p-5 xl:col-span-1">
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
          
          <div className="panel card-lift fade-up stagger-4 relative overflow-hidden p-5 xl:col-span-2 bg-gradient-to-r from-indigo-50 to-sky-50 border-indigo-100">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Usage Analytics</p>
              <HiOutlineChartBar className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-500 font-medium">Top Resource</p>
                <p className="text-lg font-bold text-slate-900 truncate" title={summary.topResource}>{summary.topResource}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Peak Booking Hour</p>
                <p className="text-lg font-bold text-slate-900">{summary.peakHour}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <div className="fade-up stagger-2 mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Data Exports</h3>
        <section className="grid gap-4 sm:grid-cols-3">
          {['users', 'tickets', 'bookings'].map(dataset => (
            <div key={dataset} className="panel flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-slate-900 capitalize">{dataset} List</p>
                <p className="text-xs text-slate-500">Download report</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExport('csv', dataset)}
                  className="inline-flex h-8 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  title="Download CSV"
                >
                  CSV
                </button>
                <button 
                  onClick={() => handleExport('pdf', dataset)}
                  className="inline-flex h-8 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  title="Download PDF"
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="mb-6 fade-up stagger-3">
        <h3 className="text-lg font-semibold text-slate-800">Management Modules</h3>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 fade-up stagger-3">
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
