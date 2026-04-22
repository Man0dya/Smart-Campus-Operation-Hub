import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../../context/auth-context";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationApi";
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

const technicianNavItems = [
  { to: "/technician/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
  { to: "/admin/tickets", label: "Ticket Command", icon: HiOutlineWrenchScrewdriver, end: true },
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

const isNotificationRead = (notification) => {
  if (typeof notification?.read === "boolean") {
    return notification.read;
  }
  if (typeof notification?.isRead === "boolean") {
    return notification.isRead;
  }
  return false;
};

const extractTicketId = (notification) => {
  const text = `${notification?.title || ""} ${notification?.message || ""}`;
  const match = text.match(/ticket\s+([A-Za-z0-9_-]+)/i);
  return match?.[1] || "";
};

const authServerOrigin = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";

function AuthenticatedLayout({ title, subtitle, children }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedPopupNotificationIds, setDismissedPopupNotificationIds] = useState([]);
  const notificationRef = useRef(null);

  const sidebarNavItems = useMemo(() => {
    if (user?.role === "ADMIN") return adminNavItems;
    if (user?.role === "TECHNICIAN") return technicianNavItems;
    return userNavItems;
  }, [user?.role]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      return;
    }

    setNotificationLoading(true);
    try {
      const res = await getNotifications();
      const nextNotifications = res.data || [];
      setNotifications(nextNotifications);
      setDismissedPopupNotificationIds((prev) =>
        prev.filter((id) => nextNotifications.some((item) => item.id === id))
      );
    } catch {
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (notificationOpen) {
      void loadNotifications();
    }
  }, [notificationOpen, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const popupNotifications = useMemo(
    () => notifications.filter((notification) => !dismissedPopupNotificationIds.includes(notification.id)),
    [notifications, dismissedPopupNotificationIds]
  );

  const unreadCount = useMemo(
    () => popupNotifications.filter((notification) => !isNotificationRead(notification)).length,
    [popupNotifications]
  );

  const recentNotifications = useMemo(() => popupNotifications.slice(0, 5), [popupNotifications]);

  const handleLogout = () => {
    window.location.href = `${authServerOrigin}/logout`;
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
                isRead: true,
              }
            : item
        )
      );
    } catch {
      // Keep UI responsive even if mark-read fails silently.
    }
  };

  const resolveNotificationPath = (notification) => {
    const type = String(notification?.type || "").toUpperCase();
    const ticketId = extractTicketId(notification);

    if (type === "BOOKING") {
      if (user?.role === "ADMIN") {
        return "/bookings/admin";
      }
      return "/bookings/my";
    }

    if (type === "TICKET" || type === "COMMENT") {
      if (ticketId) {
        return `/tickets/${ticketId}`;
      }
      if (user?.role === "ADMIN" || user?.role === "TECHNICIAN") {
        return "/admin/tickets";
      }
      return "/notifications";
    }

    return "/notifications";
  };

  const handleNotificationClick = async (notification) => {
    if (!isNotificationRead(notification)) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read: true,
                  isRead: true,
                }
              : item
          )
        );
      } catch {
        // Proceed with navigation even if mark-read fails.
      }
    }

    setNotificationOpen(false);
    navigate(resolveNotificationPath(notification));
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      const res = await markAllNotificationsAsRead();
      if (Array.isArray(res?.data)) {
        setNotifications(res.data);
      } else {
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            read: true,
            isRead: true,
          }))
        );
      }
    } catch {
      // Keep UI usable even if mark-all fails.
    }
  };

  const handleClearAllNotifications = async () => {
    if (popupNotifications.length === 0) {
      return;
    }

    const idsToDismiss = popupNotifications.map((notification) => notification.id);
    setDismissedPopupNotificationIds((prev) => [...new Set([...prev, ...idsToDismiss])]);
  };

  const NavItem = ({ to, label, icon, end = false }) => (
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
      {icon({ className: "h-5 w-5" })}
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
          <div className="flex items-center">
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
              Smart Campus Hub
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
            {sidebarNavItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
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
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 overflow-visible border-b border-slate-200/90 bg-white/85 px-4 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8">
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
            <div className="relative" ref={notificationRef}>
              <button
                className="relative rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                onClick={() => setNotificationOpen((prev) => !prev)}
                aria-label="Open notifications"
                aria-expanded={notificationOpen}
              >
                <HiOutlineBell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              <div
                className={`absolute right-0 top-12 z-[120] w-96 max-w-[calc(100vw-2rem)] origin-top-right rounded-lg border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
                  notificationOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">Most recent 5</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`text-xs font-semibold ${
                        unreadCount > 0
                          ? "text-slate-700 hover:text-slate-900"
                          : "cursor-not-allowed text-slate-400"
                      }`}
                      onClick={() => void handleMarkAllRead()}
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                    <button
                      type="button"
                      className={`text-xs font-semibold ${
                        popupNotifications.length > 0
                          ? "text-rose-700 hover:text-rose-800"
                          : "cursor-not-allowed text-slate-400"
                      }`}
                      onClick={() => void handleClearAllNotifications()}
                      disabled={popupNotifications.length === 0}
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/notifications");
                      }}
                    >
                      View all
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto p-2">
                  {notificationLoading && (
                    <p className="px-3 py-3 text-sm text-slate-500">Loading notifications...</p>
                  )}

                  {!notificationLoading && recentNotifications.length === 0 && (
                    <p className="px-3 py-3 text-sm text-slate-500">No notifications yet.</p>
                  )}

                  {!notificationLoading &&
                    recentNotifications.map((notification) => {
                      const unread = !isNotificationRead(notification);
                      return (
                        <article
                          key={notification.id}
                          className={`mb-2 cursor-pointer rounded-lg border p-3 transition ${
                            unread
                              ? "border-blue-200 bg-blue-50/60"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                          onClick={() => void handleNotificationClick(notification)}
                        >
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                            {unread && <span className="chip chip-info">New</span>}
                          </div>
                          <p className="line-clamp-2 text-sm text-slate-600">{notification.message}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-500">{notification.createdAt}</span>
                            {unread && (
                              <button
                                type="button"
                                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleMarkRead(notification.id);
                                }}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>
            </div>
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
