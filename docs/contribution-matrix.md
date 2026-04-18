# Contribution Matrix

Update names and roles before final submission if your group roster differs.

| Member | Backend Endpoints (min 4, mixed HTTP methods) | Frontend Components/Pages | Notes |
|---|---|---|---|
| Member 1 - Sanduni Dulakshika | `GET /api/resources`, `GET /api/resources/{id}`, `POST /api/resources`, `PUT /api/resources/{id}`, `DELETE /api/resources/{id}` | `ResourcesPage`, `AdminResourcesPage` | Module A owner |
| Member 2 - Manodya Dissanayake | `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings`, `PATCH /api/bookings/{id}/approve`, `PATCH /api/bookings/{id}/reject`, `PATCH /api/bookings/{id}/cancel` | `CreateBookingPage`, `MyBookingsPage`, `AdminBookingsPage` | Module B owner |
| Member 3 - TBD | `POST /api/tickets`, `PATCH /api/tickets/{id}/status`, `POST /api/tickets/{id}/attachments`, `POST /api/comments`, `PATCH /api/comments/{id}`, `DELETE /api/comments/{id}` | `CreateTicketPage`, `TicketDetailsPage`, `AdminTicketsPage` | Module C owner (update with actual member) |
| Member 4 - TBD | `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`, `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/register` | `AuthenticatedLayout`, `NotificationsPage`, `LoginPage` | Module D/E owner (update with actual member) |

## Verification Checklist
- Each member has at least 4 backend endpoints including mixed HTTP methods.
- Each member has visible frontend contribution.
- Commit history aligns with this table.
