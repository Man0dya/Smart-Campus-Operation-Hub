# Testing and Quality Evidence

## Automated Tests

### Backend Unit Tests
- `BookingServiceTest`
  - booking creation and pending status
  - overlap conflict detection
  - rejection reason requirement
  - invalid transition prevention
- `TicketServiceTest`
  - ticket creation default OPEN status
  - invalid transition prevention
  - rejection reason requirement

Run:
```bash
cd backend
./mvnw test
```

### Build Verification
- Backend verify:
```bash
cd backend
./mvnw verify
```
- Frontend production build:
```bash
cd frontend
npm run build
```

## Manual/API Evidence Checklist
- OAuth2 login success and role-based landing page
- Resource search/filtering and admin CRUD
- Booking create, approve/reject with reason, cancel approved booking
- Booking conflict prevention
- Ticket creation with image uploads (max 3)
- Ticket transition workflow (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED)
- Ticket rejection with mandatory reason
- Comment ownership (edit/delete own only)
- Notification dropdown and mark read / mark all read

## Artifacts to Attach Before Submission
- Postman collection export (or additional integration test logs)
- Screenshots of key workflows
- CI pipeline run screenshots from GitHub Actions
- Optional short demo video link
