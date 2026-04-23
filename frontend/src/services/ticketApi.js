import api from "./api";

export const createTicket = (payload) => api.post("/tickets", payload);
export const getMyTickets = () => api.get("/tickets/my");
export const getAllTickets = () => api.get("/tickets");
export const getTicketById = (id) => api.get(`/tickets/${id}`);
export const cancelTicket = (id) => api.patch(`/tickets/${id}/cancel`);
export const updateTicketStatus = (id, payload) =>
  api.patch(`/tickets/${id}/status`, payload);
export const postTicketResponse = (id, payload) =>
  api.patch(`/tickets/${id}/response`, payload);
export const deleteAdminTicket = (id) => api.delete(`/tickets/${id}`);

export const getAssignedTickets = () => api.get("/tickets/assigned");
export const getAvailableTechnicians = (category) =>
  api.get("/tickets/available-technicians", { params: category ? { category } : {} });

export const uploadTicketAttachments = (id, files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  return api.post(`/tickets/${id}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getCommentsByTicket = (ticketId) =>
  api.get(`/comments/ticket/${ticketId}`);
export const createComment = (payload) => api.post("/comments", payload);
export const updateComment = (id, payload) => api.patch(`/comments/${id}`, payload);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
