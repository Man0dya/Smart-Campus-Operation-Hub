import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import AuthContext from "../../context/auth-context";
import {
  HiOutlineHome,
  HiOutlineRectangleGroup,
  HiOutlineCalendarDays,
  HiOutlineBookmarkSquare,
  HiOutlineExclamationTriangle,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
  HiOutlineInboxStack,
  HiOutlineUserGroup,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark
} from "react-icons/hi2";

const userNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
  { to: "/resources", label: "Resources", icon: HiOutlineRectangleGroup, end: true },
  { to: "/bookings/create", label: "Book Resource", icon: HiOutlineCalendarDays, end: true },
  { to: "/bookings/my", label: "My Bookings", icon: HiOutlineBookmarkSquare, end: true },
  { to: "/tickets/create", label: "Report Issue", icon: HiOutlineExclamationTriangle, end: true },
  { to: "/notifications", label: "Notifications", icon: HiOutlineBell, end: true },
];

const adminNavItems = [
  { to: "/admin", label: "Admin Hub", icon: HiOutlineShieldCheck, end: true },
  { to: "/bookings/admin", label: "Bookings", icon: HiOutlineClipboardDocumentList, end: true },
  { to: "/admin/tickets", label: "Tickets", icon: HiOutlineWrenchScrewdriver, end: true },
  { to: "/admin/resources", label: "Resources", icon: HiOutlineInboxStack, end: true },
  { to: "/admin/users", label: "Users", icon: HiOutlineUserGroup, end: true },
  { to: "/notifications", label: "Notifications", icon: HiOutlineBell, end: true },
];

function AuthenticatedLayout({ title, subtitle, children }) {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "http://localhost:8080/logout";
  };

  const NavItem = ({ to, label, icon: Icon, end = false }) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "border-slate-300 bg-slate-900 text-white"
            : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:flex lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-900 text-white font-bold">
              SC
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
              Smart Campus
            </span>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            <div className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Menu
            </div>
            {user?.role === "ADMIN" ? (
              adminNavItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))
            ) : (
              userNavItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))
            )}
          </div>

          {user?.role === "TECHNICIAN" && (
            <div className="mt-8 space-y-1">
              <div className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Service Desk
              </div>
              <NavItem to="/admin/tickets" label="Ticket Command" icon={HiOutlineWrenchScrewdriver} end={true} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3">
            <NavItem to="/profile" label="Profile" icon={HiOutlineUser} end={true} />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <HiArrowRightOnRectangle className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/90 bg-white/85 px-4 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8">
          <button
            className="text-slate-500 hover:text-slate-800 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <HiBars3 className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="hidden text-sm text-slate-500 sm:block">{subtitle}</p>}
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none">
              <HiOutlineBell className="h-6 w-6" />
              <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-slate-500 ring-2 ring-white" />
            </button>
            <div className="hidden h-6 w-px bg-slate-200 sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  Welcome, {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role?.toLowerCase() || "User"}
                </p>
              </div>
              <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthenticatedLayout;
