import api from "./api";

export const getAllUsers = () => api.get("/admin/users");
export const updateUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role });
