# Endpoint Inventory

## Module A - Resources
- `GET /api/resources` - List resources with type, capacity, location, status filters - Public
- `GET /api/resources/{id}` - Get resource by id - Public
- `POST /api/resources` - Create resource - ADMIN
- `PUT /api/resources/{id}` - Update resource - ADMIN
- `DELETE /api/resources/{id}` - Delete resource - ADMIN

## Module B - Bookings
- `POST /api/bookings` - Create booking request - Authenticated
- `GET /api/bookings/my` - Get current user's bookings - Authenticated
- `GET /api/bookings` - Get all bookings with status, resourceId, date, userId filters - ADMIN
- `GET /api/bookings/availability` - Get resource availability for a specific date - Authenticated
- `PATCH /api/bookings/{id}/approve` - Approve booking - ADMIN
- `PATCH /api/bookings/{id}/reject` - Reject booking with optional reason - ADMIN
- `PATCH /api/bookings/{id}/cancel` - Cancel booking - owner or ADMIN
- `DELETE /api/bookings/{id}` - Delete booking - owner (PENDING only) or ADMIN

## Module C - Tickets and Comments
- `POST /api/tickets` - Create incident ticket - Authenticated
- `GET /api/tickets/my` - Get current user's tickets - Authenticated
- `GET /api/tickets` - Get all tickets - ADMIN
- `GET /api/tickets/{id}` - Get ticket details - owner, ADMIN, or TECHNICIAN
- `GET /api/tickets/assigned` - Get tickets assigned to current technician - TECHNICIAN
- `GET /api/tickets/available-technicians` - List available technicians by category - ADMIN
- `PATCH /api/tickets/{id}/status` - Update ticket status and assignment - ADMIN/TECHNICIAN
- `PATCH /api/tickets/{id}/accept` - Technician accepts assigned ticket - TECHNICIAN
- `PATCH /api/tickets/{id}/reject` - Technician rejects assigned ticket - TECHNICIAN
- `PATCH /api/tickets/{id}/response` - Add technician response/resolution notes - ADMIN/TECHNICIAN
- `PATCH /api/tickets/{id}/cancel` - Cancel ticket - owner, ADMIN, or TECHNICIAN
- `POST /api/tickets/{id}/attachments` - Upload up to 3 images - owner, ADMIN, or TECHNICIAN
- `GET /api/tickets/attachments/{fileName}` - Serve attachment file (legacy local storage)
- `DELETE /api/tickets/{id}` - Delete ticket - ADMIN
- `GET /api/comments/ticket/{ticketId}` - List comments by ticket - Authenticated
- `POST /api/comments` - Add comment - Authenticated
- `PATCH /api/comments/{id}` - Update own comment - Authenticated
- `DELETE /api/comments/{id}` - Delete own comment - Authenticated

## Module D - Notifications
- `GET /api/notifications` - List user's notifications - Authenticated
- `PATCH /api/notifications/{id}/read` - Mark one as read - owner only
- `PATCH /api/notifications/read-all` - Mark all as read - owner only
- `DELETE /api/notifications/clear-all` - Clear all notifications - owner only

## Module E - Auth and User Management
- `POST /api/auth/register` - Register local account - Public
- `POST /api/auth/login` - Login local account - Public
- `GET /api/auth/me` - Get current session user - Authenticated
- `POST /api/auth/logout` - Logout current session - Authenticated
- `GET /api/admin/users` - List all users - ADMIN
- `POST /api/admin/users` - Create user - ADMIN
- `PUT /api/admin/users/{id}` - Update user (name, email, password, role) - ADMIN
- `DELETE /api/admin/users/{id}` - Delete user - ADMIN
- `PATCH /api/admin/users/{id}/role` - Update user role only - ADMIN

## Standard Error Format
All API errors are returned as:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details` (validation-level details)

## Standard Error Format
All API errors are returned as:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details` (validation-level details)
