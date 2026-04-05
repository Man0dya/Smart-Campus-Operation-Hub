import api from "./api";

export const getAllResources = (params) => api.get("/resources", { params });
export const createResource = (payload) => api.post("/resources", payload);
export const updateResource = (id, payload) => api.put(`/resources/${id}`, payload);
export const deleteResource = (id) => api.delete(`/resources/${id}`);
