import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import PaginationControls from "../components/common/PaginationControls";

const isNotificationRead = (notification) => {
  if (typeof notification?.read === "boolean") {
    return notification.read;
  }
  if (typeof notification?.isRead === "boolean") {
    return notification.isRead;
  }
  return false;
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load notifications.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadNotifications]);

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
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to mark notification as read.");
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const query = searchQuery.trim().toLowerCase();
    const isRead = isNotificationRead(notification);

    if (readFilter === "READ" && !isRead) {
      return false;
    }
    if (readFilter === "UNREAD" && isRead) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [notification.title, notification.message, notification.type]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, readFilter, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredNotifications.length, page, pageSize]);

  const start = (page - 1) * pageSize;
  const paginatedNotifications = filteredNotifications.slice(start, start + pageSize);

  return (
    <AuthenticatedLayout
      title="Notifications"
      subtitle="Stay updated on bookings, tickets, and conversation changes"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="panel mb-5 flex flex-wrap items-center gap-3">
        <input
          className="field min-w-64 flex-1"
          placeholder="Search notifications"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select className="field w-44" value={readFilter} onChange={(event) => setReadFilter(event.target.value)}>
          <option value="ALL">All</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
        </select>
      </section>

      <section className="grid gap-3">
        {filteredNotifications.length === 0 && (
          <div className="panel text-sm text-slate-600">No notifications yet.</div>
        )}

        {paginatedNotifications.map((notification) => (
          <article
            key={notification.id}
            className={`panel ${isNotificationRead(notification) ? "border-slate-200" : "border-cyan-300 bg-cyan-50"}`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">{notification.title}</h3>
              {!isNotificationRead(notification) && <span className="chip">New</span>}
            </div>
            <p className="text-sm text-slate-700">{notification.message}</p>
            <p className="mt-2 text-xs text-slate-500">{notification.createdAt}</p>

            {!isNotificationRead(notification) && (
              <button className="btn-secondary mt-3" onClick={() => handleMarkRead(notification.id)}>
                Mark as Read
              </button>
            )}
          </article>
        ))}
      </section>

      {filteredNotifications.length > 0 && (
        <section className="panel mt-4 p-0">
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredNotifications.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </section>
      )}
    </AuthenticatedLayout>
  );
}

export default NotificationsPage;
