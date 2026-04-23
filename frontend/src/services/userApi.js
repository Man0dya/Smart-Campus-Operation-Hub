import api from "./api";

export const updateMyAvailability = (payload) => api.patch("/users/me/availability", payload);

export const updateMySkills = (payload) => api.patch("/users/me/skills", payload);

export const verifyTechnicianSkill = (userId, skillName, verified) =>
  api.patch(`/users/${userId}/skills/verify`, null, { params: { skillName, verified } });
