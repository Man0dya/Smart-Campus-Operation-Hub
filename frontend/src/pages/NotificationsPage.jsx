import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notificationApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

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
      await loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to mark notification as read.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Notifications"
      subtitle="Stay updated on bookings, tickets, and conversation changes"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-3">
        {notifications.length === 0 && (
          <div className="panel text-sm text-slate-600">No notifications yet.</div>
        )}

        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`panel ${notification.read ? "border-slate-200" : "border-cyan-300 bg-cyan-50"}`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">{notification.title}</h3>
              {!notification.read && <span className="chip">New</span>}
            </div>
            <p className="text-sm text-slate-700">{notification.message}</p>
            <p className="mt-2 text-xs text-slate-500">{notification.createdAt}</p>

            {!notification.read && (
              <button className="btn-secondary mt-3" onClick={() => handleMarkRead(notification.id)}>
                Mark as Read
              </button>
            )}
          </article>
        ))}
      </section>
    </AuthenticatedLayout>
  );
}

export default NotificationsPage;
