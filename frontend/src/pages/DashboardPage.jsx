import { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/auth-context";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function DashboardPage() {
  const { user } = useContext(AuthContext);

  const cards = [
    {
      title: "Browse Resources",
      desc: "Search lecture halls, labs, rooms, and equipment.",
      to: "/resources",
    },
    {
      title: "Request Booking",
      desc: "Submit a new booking request for campus resources.",
      to: "/bookings/create",
    },
    {
      title: "My Bookings",
      desc: "Track statuses and cancel future bookings.",
      to: "/bookings/my",
    },
    {
      title: "Report Incident",
      desc: "Create maintenance tickets with image evidence.",
      to: "/tickets/create",
    },
    {
      title: "Notifications",
      desc: "See approval decisions and workflow updates.",
      to: "/notifications",
    },
    {
      title: "My Profile",
      desc: "View your account and role details.",
      to: "/profile",
    },
  ];

  return (
    <AuthenticatedLayout
      title="Operations Dashboard"
      subtitle="Central command for bookings, incident tickets, and updates"
    >
      <section className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
        <p className="text-sm text-cyan-800">
          Welcome back, <span className="font-semibold">{user?.name || "User"}</span>. Your current role is
          <span className="ml-1 rounded-full bg-cyan-200 px-2 py-0.5 text-xs font-semibold text-cyan-900">
            {user?.role || "USER"}
          </span>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="panel block transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="mb-2 text-lg font-bold text-slate-900">{card.title}</h3>
            <p className="text-sm text-slate-600">{card.desc}</p>
          </Link>
        ))}
        {user?.role === "ADMIN" && (
          <>
            <Link
              to="/admin"
              className="panel block border-indigo-200 bg-indigo-50 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-bold text-indigo-900">Admin Control Center</h3>
              <p className="text-sm text-indigo-800">
                Open the full admin dashboard for booking, ticket, and resource management.
              </p>
            </Link>

            <Link
              to="/bookings/admin"
              className="panel block border-amber-200 bg-amber-50 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-bold text-amber-900">Admin Booking Queue</h3>
              <p className="text-sm text-amber-800">
                Review and process pending booking requests with approval or rejection reasons.
              </p>
            </Link>
          </>
        )}

        {user?.role === "TECHNICIAN" && (
          <Link
            to="/admin/tickets"
            className="panel block border-cyan-200 bg-cyan-50 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="mb-2 text-lg font-bold text-cyan-900">Technician Ticket Queue</h3>
            <p className="text-sm text-cyan-800">
              Review open incidents, update status, and attach resolution notes from one command view.
            </p>
          </Link>
        )}
      </section>

      <section className="mt-6 panel">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">Quick Tip</h3>
        <p className="text-sm text-slate-600">
          To view a specific ticket thread, open the ticket detail route with the real ticket ID,
          for example <span className="font-mono">/tickets/&lt;ticket-id&gt;</span>.
        </p>
      </section>
    </AuthenticatedLayout>
  );
}

export default DashboardPage;