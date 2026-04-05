import { useContext } from "react";
import { NavLink } from "react-router-dom";
import AuthContext from "../../context/auth-context";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/resources", label: "Resources" },
  { to: "/bookings/create", label: "Book" },
  { to: "/bookings/my", label: "My Bookings" },
  { to: "/tickets/create", label: "Report Issue" },
  { to: "/notifications", label: "Notifications" },
  { to: "/profile", label: "Profile" },
];

function AuthenticatedLayout({ title, subtitle, children }) {
  const { user } = useContext(AuthContext);

  const handleLogout = () => {
    window.location.href = "http://localhost:8080/logout";
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="app-shell flex flex-col gap-4 pb-4 pt-4 md:flex-row md:items-center md:justify-between md:pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Smart Campus Hub</p>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:block">
              Signed in as <span className="font-semibold">{user?.name || "User"}</span>
            </div>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="app-shell pt-0">
          <nav className="flex flex-wrap gap-2">
            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-100 text-indigo-800"
                      : "text-indigo-700 hover:bg-indigo-50"
                  }`
                }
              >
                Admin Hub
              </NavLink>
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-100 text-cyan-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === "ADMIN" && (
              <>
                <NavLink
                  to="/bookings/admin"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-100 text-amber-800"
                        : "text-amber-700 hover:bg-amber-50"
                    }`
                  }
                >
                  Admin Bookings
                </NavLink>
                <NavLink
                  to="/admin/tickets"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-cyan-100 text-cyan-800"
                        : "text-cyan-700 hover:bg-cyan-50"
                    }`
                  }
                >
                  Admin Tickets
                </NavLink>
                <NavLink
                  to="/admin/resources"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`
                  }
                >
                  Admin Resources
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-shell">{children}</main>
    </div>
  );
}

export default AuthenticatedLayout;
