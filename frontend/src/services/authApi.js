import api from "./api";

export const registerLocalUser = (payload) => api.post("/auth/register", payload);
export const loginLocalUser = (payload) => api.post("/auth/login", payload);
export const logoutLocalUser = () => api.post("/auth/logout");
