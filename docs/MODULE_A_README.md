# Module A — Facilities and Assets Catalogue

This document describes what was implemented for **Module A** in the Smart Campus Operations Hub.

## Scope Implemented

Module A provides a **Resource Catalogue** with:
- A persisted **Resource** data model stored in MongoDB.
- Public **search + filtering** of resources.
- Admin-only **CRUD** management of resources.

## Data Model

**MongoDB Collection**: `resources`

Resource fields:
- `id` (String) — MongoDB document id
- `name` (String) — resource display name
- `type` (enum) — `LECTURE_HALL | LAB | MEETING_ROOM | EQUIPMENT`
- `capacity` (Integer, nullable)
- `location` (String, nullable)
- `availabilityStart` (String, nullable, `HH:mm`)
- `availabilityEnd` (String, nullable, `HH:mm`)
- `status` (enum) — `ACTIVE | OUT_OF_SERVICE`
- `description` (String, nullable)

## Backend Implementation

### Endpoints

Base path: `/api/resources`

1) List resources (with filters)
- `GET /api/resources`
- Auth: public (per security config)
- Query params (all optional):
  - `type`: `LECTURE_HALL|LAB|MEETING_ROOM|EQUIPMENT`
  - `minCapacity`: integer
  - `maxCapacity`: integer
  - `location`: string (case-insensitive “contains” match)
  - `status`: `ACTIVE|OUT_OF_SERVICE`

2) Get resource by id
- `GET /api/resources/{id}`
- Auth: public

3) Create resource
- `POST /api/resources`
- Auth: **ADMIN** required
- Body: `CreateResourceRequest`

4) Update resource
- `PUT /api/resources/{id}`
- Auth: **ADMIN** required
- Body: `UpdateResourceRequest`

5) Delete resource
- `DELETE /api/resources/{id}`
- Auth: **ADMIN** required

### Request DTOs + Validation

`CreateResourceRequest`
- `name`: required, max 120 chars
- `type`: required
- `capacity`: optional, must be ≥ 0 if provided
- `location`: optional, max 120 chars
- `availabilityStart` / `availabilityEnd`: optional, must match `HH:mm` when provided
- `status`: optional (defaults to `ACTIVE` if omitted)
- `description`: optional, max 500 chars

`UpdateResourceRequest`
- Same as create, but `status` is required.

### Filtering Strategy

Filtering is executed at the **database level** using `MongoTemplate` queries (not in-memory filtering), which supports:
- Exact matches for `type` and `status`
- Range filters for `capacity`
- Case-insensitive regex “contains” filter for `location`

## Frontend Integration

The frontend already includes:
- Resource listing + filtering UI: `ResourcesPage`
- Admin CRUD UI: `AdminResourcesPage`
- API wrappers: `frontend/src/services/resourceApi.js`

The backend endpoints above are compatible with the existing frontend API calls (`GET /resources`, `POST /resources`, `PUT /resources/{id}`, `DELETE /resources/{id}`).

## Quick Test Commands (Examples)

List all resources:
```bash
curl http://localhost:8080/api/resources
```

Filter by type + capacity:
```bash
curl "http://localhost:8080/api/resources?type=LAB&minCapacity=20&maxCapacity=40"
```

Filter by location substring:
```bash
curl "http://localhost:8080/api/resources?location=Block%20A"
```

Create (ADMIN only):
```bash
curl -X POST http://localhost:8080/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lab 01",
    "type": "LAB",
    "capacity": 30,
    "location": "Engineering Block",
    "availabilityStart": "08:00",
    "availabilityEnd": "17:00",
    "status": "ACTIVE",
    "description": "Computer lab"
  }'
```

Note: ADMIN endpoints require an authenticated session with ADMIN role.
