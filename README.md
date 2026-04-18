# Smart Campus Operations Hub

Production-inspired university operations platform for IT3030 PAF 2026.

## Tech Stack
- Backend: Spring Boot 3, Spring Security OAuth2, MongoDB
- Frontend: React + Vite
- CI: GitHub Actions

## Repository Structure
- `backend`: REST API and business logic
- `frontend`: web client
- `docs`: architecture, requirements, endpoints, testing, contribution mapping

## Prerequisites
- Java 17+
- Node.js 20+
- MongoDB (local or Atlas)

## Environment Configuration

### Backend
Copy `backend/.env.example` values into your environment before running.

Required variables:
- `MONGODB_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_UPLOAD_DIR` (optional)
- `SERVER_PORT` (optional)

### Frontend
Copy `frontend/.env.example` values into your environment before running.

Required variables:
- `VITE_API_BASE_URL`
- `VITE_API_ORIGIN`

## Run Locally

### 1. Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`
Backend default: `http://localhost:8080`

## Test and Build

### Backend tests
```bash
cd backend
./mvnw test
```

### Backend compile/verify
```bash
cd backend
./mvnw verify
```

### Frontend production build
```bash
cd frontend
npm run build
```

## Assignment Artifact Map
- Requirements + architecture: `docs/requirements-and-architecture.md`
- Endpoint inventory: `docs/endpoint-inventory.md`
- Testing evidence: `docs/testing-evidence.md`
- Contribution matrix: `docs/contribution-matrix.md`
- Module A implementation notes: `docs/MODULE_A_README.md`
- CI workflow: `.github/workflows/ci.yml`

## Core Workflows Covered
- Resource catalogue + filtering + admin CRUD
- Booking workflow with conflict checks and admin decisions
- Ticket workflow with attachment handling and technician/admin updates
- Ticket comments with ownership rules
- Notification panel with mark-read and mark-all-read
- OAuth2 and role-based route/API protection

## Submission Notes
- Do not include generated artifacts in submission package:
	- `backend/target`
	- `frontend/dist`
	- `frontend/node_modules`
	- runtime upload dumps
- Ensure `docs/contribution-matrix.md` and report match actual implementation and commit history.

## Team Clone Troubleshooting (OAuth/Login)
- If Google login says `invalid_client`, verify backend `.env` has real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Ensure `MONGODB_URI` includes a database path, e.g. `/smartcampusdb`.
- Keep frontend running on `http://localhost:5173` (Vite is configured with strict port).
- In Google Cloud OAuth client settings, authorized redirect URI must include:
	- `http://localhost:8080/login/oauth2/code/google`
- If using a different frontend URL, update `FRONTEND_URL` in backend `.env` accordingly.
