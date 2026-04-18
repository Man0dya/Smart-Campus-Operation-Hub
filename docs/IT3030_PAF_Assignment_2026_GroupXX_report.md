# IT3030 PAF Assignment 2026 - Group XX

## 1. Introduction
Smart Campus Operations Hub is a unified web platform for university operations covering resources, bookings, maintenance ticketing, notifications, and role-based access.

## 2. Requirements Summary
- Module A: facilities and assets catalogue with filtering
- Module B: booking workflow with conflict prevention
- Module C: incident tickets, attachments, assignment, and comments
- Module D: notification lifecycle and read management
- Module E: OAuth2 and role-based authorization

## 3. Architecture
Refer:
- `docs/requirements-and-architecture.md`
- `docs/endpoint-inventory.md`

## 4. API Design and Endpoints
See `docs/endpoint-inventory.md` for full list with methods and scopes.

## 5. Validation, Error Handling, and Security
- DTO-level validation using Jakarta Bean Validation
- Centralized structured error response
- OAuth2 Google login + session auth
- Role checks in backend services/controllers
- Safe file upload validation for ticket attachments

## 6. Testing and Quality Evidence
See `docs/testing-evidence.md`.

## 7. CI/CD
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Backend verify and frontend build on push and PR

## 8. Team Contribution Summary
See `docs/contribution-matrix.md`.

## 9. Demonstration Evidence
Attach in final submission:
- workflow screenshots
- CI run screenshots
- OAuth login evidence
- optional demo video link

## 10. Conclusion
The solution satisfies the minimum requirements and includes additional hardening around workflow enforcement, structured validation errors, and auditable status changes.
