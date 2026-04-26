import api from "./api";

export const getMyBookings = () => api.get("/bookings/my");
export const getAllBookings = () => api.get("/bookings");
export const getBookingAvailability = (resourceId, date) =>
  api.get("/bookings/availability", { params: { resourceId, date } });
export const createBooking = (payload) => api.post("/bookings", payload);
export const approveBooking = (id, reason) =>
  api.patch(`/bookings/${id}/approve`, reason ? { reason } : {});
export const rejectBooking = (id, reason) =>
  api.patch(`/bookings/${id}/reject`, reason ? { reason } : {});
export const cancelBooking = (id, reason) =>
  api.patch(`/bookings/${id}/cancel`, reason ? { reason } : {});
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);
export const deleteAdminBooking = (id) => api.delete(`/bookings/${id}`);
