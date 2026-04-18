import api from "./api";

export const getAllUsers = () => api.get("/admin/users");
export const updateUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role });

export const createAdminUser = (payload) => api.post("/admin/users", payload);

export const updateAdminUser = (id, payload) =>
  api.put(`/admin/users/${id}`, payload);

export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
