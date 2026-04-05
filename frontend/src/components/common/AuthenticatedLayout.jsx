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
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { to: "/resources", label: "Resources", icon: HiOutlineRectangleGroup },
  { to: "/bookings/create", label: "Book Resource", icon: HiOutlineCalendarDays },
  { to: "/bookings/my", label: "My Bookings", icon: HiOutlineBookmarkSquare },
  { to: "/tickets/create", label: "Report Issue", icon: HiOutlineExclamationTriangle },
  { to: "/notifications", label: "Notifications", icon: HiOutlineBell },
  { to: "/profile", label: "Profile", icon: HiOutlineUser },
];

function AuthenticatedLayout({ title, subtitle, children }) {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "http://localhost:8080/logout";
  };

  const NavItem = ({ to, label, icon: Icon }) => (
    <NavLink
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-cyan-50 text-cyan-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:flex lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white font-bold">
              SC
            </div>
            <span className="text-sm font-bold tracking-wide text-slate-800 uppercase">
              Smart Campus
            </span>
          </div>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Menu
            </div>
            {userNavItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>

          {user?.role === "ADMIN" && (
            <div className="mt-8 space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Administration
              </div>
              <NavItem to="/admin" label="Admin Hub" icon={HiOutlineShieldCheck} />
              <NavItem to="/bookings/admin" label="Bookings" icon={HiOutlineClipboardDocumentList} />
              <NavItem to="/admin/tickets" label="Tickets" icon={HiOutlineWrenchScrewdriver} />
              <NavItem to="/admin/resources" label="Resources" icon={HiOutlineInboxStack} />
              <NavItem to="/admin/users" label="Users" icon={HiOutlineUserGroup} />
            </div>
          )}

          {user?.role === "TECHNICIAN" && (
            <div className="mt-8 space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Service Desk
              </div>
              <NavItem to="/admin/tickets" label="Ticket Command" icon={HiOutlineWrenchScrewdriver} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-medium text-slate-900">
                {user?.name || "User"}
              </span>
              <span className="truncate text-xs text-slate-500">
                {user?.role || "USER"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <HiArrowRightOnRectangle className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <button
            className="text-slate-500 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <HiBars3 className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 hidden sm:block">{subtitle}</p>}
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative text-slate-500 hover:text-cyan-600 transition-colors focus:outline-none">
              <HiOutlineBell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  Welcome, {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role?.toLowerCase() || "User"}
                </p>
              </div>
              <button className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold border border-cyan-200 shadow-sm transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2">
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
