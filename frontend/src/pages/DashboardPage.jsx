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
      tag: "Catalogue",
    },
    {
      title: "Request Booking",
      desc: "Submit a new booking request for campus resources.",
      to: "/bookings/create",
      icon: HiOutlineCalendarDays,
      tag: "Bookings",
    },
    {
      title: "My Bookings",
      desc: "Track statuses and cancel future bookings.",
      to: "/bookings/my",
      icon: HiOutlineBookmarkSquare,
      tag: "Bookings",
    },
    {
      title: "Report Incident",
      desc: "Create maintenance tickets with image evidence.",
      to: "/tickets/create",
      icon: HiOutlineExclamationTriangle,
      tag: "Support",
    },
    {
      title: "Notifications",
      desc: "See approval decisions and workflow updates.",
      to: "/notifications",
      icon: HiOutlineBell,
      tag: "Inbox",
    },
    {
      title: "My Profile",
      desc: "View your account and role details.",
      to: "/profile",
      icon: HiOutlineUser,
      tag: "Account",
    },
  ];

  const roleCards = [];

  if (user?.role === "ADMIN") {
    roleCards.push(
      {
        title: "Admin Hub",
        desc: "Open the full admin command workspace.",
        to: "/admin",
        icon: HiOutlineShieldCheck,
        tag: "Admin",
      },
      {
        title: "Booking Queue",
        desc: "Review and process pending booking requests.",
        to: "/bookings/admin",
        icon: HiOutlineClipboardDocumentList,
        tag: "Admin",
      }
    );
  }

  if (user?.role === "TECHNICIAN") {
    roleCards.push(
      {
        title: "My Assigned Tickets",
        desc: "View and resolve tickets assigned to you by admin.",
        to: "/technician/dashboard",
        icon: HiOutlineWrenchScrewdriver,
        tag: "Service",
      }
    );
  }

  const allCards = [...cards, ...roleCards];

  return (
    <AuthenticatedLayout
      title="Operations Dashboard"
      subtitle="Central command for bookings, incident tickets, and updates"
    >
      <section className="dashboard-hero fade-up mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Campus Workspace
            </p>
            <h2 className="text-xl font-bold text-slate-900">
            Welcome back, {user?.name || "User"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You are currently operating as
              <span className="chip ml-2">{user?.role || "USER"}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-right">
            <div className="panel min-w-28 p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Modules</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{allCards.length}</p>
            </div>
            <div className="panel min-w-28 p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Role</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{user?.role || "USER"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="fade-up stagger-1 mb-5">
        <h3 className="text-lg font-semibold text-slate-800">Quick Access</h3>
        <p className="text-sm text-slate-500">Frequently used operations for daily campus workflows</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className={`panel card-lift fade-up group relative flex flex-col border p-5 stagger-${Math.min(index + 1, 4)}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.tag}</span>
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-900">{card.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">{card.desc}</p>
              <div className="mt-auto flex items-center text-sm font-medium text-slate-700 opacity-80 transition-opacity group-hover:opacity-100">
                Open Module <HiArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </section>
    </AuthenticatedLayout>
  );
}

export default DashboardPage;