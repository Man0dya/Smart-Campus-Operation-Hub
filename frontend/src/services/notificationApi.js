import api from "./api";

export const getNotifications = () => api.get("/notifications");
export const markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.patch("/notifications/read-all");
