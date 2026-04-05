import { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/auth-context";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import {
  HiOutlineRectangleGroup,
  HiOutlineCalendarDays,
  HiOutlineBookmarkSquare,
  HiOutlineExclamationTriangle,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
  HiArrowRight
} from "react-icons/hi2";

function DashboardPage() {
  const { user } = useContext(AuthContext);

  const cards = [
    {
      title: "Browse Resources",
      desc: "Search lecture halls, labs, rooms, and equipment.",
      to: "/resources",
      icon: HiOutlineRectangleGroup,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Request Booking",
      desc: "Submit a new booking request for campus resources.",
      to: "/bookings/create",
      icon: HiOutlineCalendarDays,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      title: "My Bookings",
      desc: "Track statuses and cancel future bookings.",
      to: "/bookings/my",
      icon: HiOutlineBookmarkSquare,
      color: "bg-violet-50 text-violet-600 border-violet-100",
    },
    {
      title: "Report Incident",
      desc: "Create maintenance tickets with image evidence.",
      to: "/tickets/create",
      icon: HiOutlineExclamationTriangle,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      title: "Notifications",
      desc: "See approval decisions and workflow updates.",
      to: "/notifications",
      icon: HiOutlineBell,
      color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
    },
    {
      title: "My Profile",
      desc: "View your account and role details.",
      to: "/profile",
      icon: HiOutlineUser,
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
  ];

  return (
    <AuthenticatedLayout
      title="Operations Dashboard"
      subtitle="Central command for bookings, incident tickets, and updates"
    >
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-cyan-900">
            Welcome back, {user?.name || "User"}
          </h2>
          <p className="mt-1 text-sm text-cyan-800">
            You are currently accessing the dashboard as a 
            <span className="ml-1.5 inline-flex items-center rounded-full bg-cyan-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cyan-900">
              {user?.role || "USER"}
            </span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Quick Access</h3>
        <p className="text-sm text-slate-500">Frequently used tools and modules</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-1"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500">{card.desc}</p>
              <div className="mt-auto flex items-center font-medium text-cyan-600 opacity-80 transition-opacity group-hover:opacity-100 text-sm">
                Open Module <HiArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          );
        })}

        {user?.role === "ADMIN" && (
          <>
            <Link
              to="/admin"
              className="group relative flex flex-col rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-indigo-100 text-indigo-700 border-indigo-200">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-indigo-900">Admin Hub</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-indigo-700/80">
                Open the full admin dashboard for booking, ticket, and resource management.
              </p>
              <div className="mt-auto flex items-center font-medium text-indigo-700 opacity-80 transition-opacity group-hover:opacity-100 text-sm">
                Enter Admin Area <HiArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            <Link
              to="/bookings/admin"
              className="group relative flex flex-col rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-amber-100 text-amber-700 border-amber-200">
                <HiOutlineClipboardDocumentList className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-amber-900">Admin Booking Queue</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-amber-800/80">
                Review and process pending booking requests with approval or rejection reasons.
              </p>
              <div className="mt-auto flex items-center font-medium text-amber-700 opacity-80 transition-opacity group-hover:opacity-100 text-sm">
                View Queue <HiArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          </>
        )}

        {user?.role === "TECHNICIAN" && (
          <Link
            to="/admin/tickets"
            className="group relative flex flex-col rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-rose-100 text-rose-700 border-rose-200">
              <HiOutlineWrenchScrewdriver className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-rose-900">Ticket Service Desk</h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-rose-800/80">
              Review open incidents, update status, and attach resolution notes from one command view.
            </p>
            <div className="mt-auto flex items-center font-medium text-rose-700 opacity-80 transition-opacity group-hover:opacity-100 text-sm">
              Open Service Desk <HiArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Link>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default DashboardPage;