import api from "./api";

export const updateMyAvailability = (payload) => api.patch("/users/me/availability", payload);
