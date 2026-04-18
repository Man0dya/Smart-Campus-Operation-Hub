# Endpoint Inventory

## Module A - Resources
- `GET /api/resources` - List resources with filters - Public
- `GET /api/resources/{id}` - Get resource by id - Public
- `POST /api/resources` - Create resource - ADMIN
- `PUT /api/resources/{id}` - Update resource - ADMIN
- `DELETE /api/resources/{id}` - Delete resource - ADMIN

## Module B - Bookings
- `POST /api/bookings` - Create booking request - Authenticated USER/ADMIN/TECHNICIAN
- `GET /api/bookings/my` - Get current user's bookings - Authenticated
- `GET /api/bookings` - Get all bookings with filters - ADMIN
- `PATCH /api/bookings/{id}/approve` - Approve booking - ADMIN
- `PATCH /api/bookings/{id}/reject` - Reject booking with reason - ADMIN
- `PATCH /api/bookings/{id}/cancel` - Cancel approved booking - owner or ADMIN

## Module C - Tickets and Comments
- `POST /api/tickets` - Create incident ticket - Authenticated
- `GET /api/tickets/my` - Get current user's tickets - Authenticated
- `GET /api/tickets` - Get all tickets - ADMIN/TECHNICIAN
- `GET /api/tickets/{id}` - Get ticket details - owner or ADMIN/TECHNICIAN
- `PATCH /api/tickets/{id}/status` - Update workflow status - ADMIN/TECHNICIAN
- `POST /api/tickets/{id}/attachments` - Upload up to 3 images - owner or ADMIN/TECHNICIAN
- `GET /api/tickets/attachments/{fileName}` - Serve attachment file
- `GET /api/comments/ticket/{ticketId}` - List comments by ticket - Authenticated
- `POST /api/comments` - Add comment - Authenticated
- `PATCH /api/comments/{id}` - Update own comment - Authenticated
- `DELETE /api/comments/{id}` - Delete own comment - Authenticated

## Module D - Notifications
- `GET /api/notifications` - List user's notifications - Authenticated
- `PATCH /api/notifications/{id}/read` - Mark one as read - owner only
- `PATCH /api/notifications/read-all` - Mark all as read - owner only

## Module E - Auth and User Management
- `POST /api/auth/register` - Register local account - Public
- `POST /api/auth/login` - Login local account - Public
- `GET /api/auth/me` - Current session user - Authenticated
- `POST /api/auth/logout` - Logout current session - Authenticated
- `GET /api/admin/users` - List users - ADMIN
- `POST /api/admin/users` - Create user - ADMIN
- `PUT /api/admin/users/{id}` - Update user - ADMIN
- `DELETE /api/admin/users/{id}` - Delete user - ADMIN
- `PATCH /api/admin/users/{id}/role` - Update role only - ADMIN

## Standard Error Format
All API errors are returned as:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details` (validation-level details)
