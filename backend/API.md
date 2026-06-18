# CampNav Backend — API Reference

> For Becca (Frontend) | All endpoints return JSON | Base URL: `http://localhost:3001`

Every response follows this shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

**Auth:** Dashboard endpoints (logs, lost-persons list/update) require `Authorization: Bearer <token>`.  
Visitor endpoints (search, directions, shuttle checkin, lost-person submit) do **not** require auth.

---

## Authentication

### `POST /api/auth/login`

Admin login — returns a Bearer token valid for 8 hours.

**Request body:**
```json
{
  "email": "admin@campnav.local",
  "password": "ChangeMe123!"
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@campnav.local",
      "name": "Demo Admin",
      "role": "admin"
    },
    "token": "eyJhbGci..."
  }
}
```

**Error (401):**
```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

---

### `POST /api/auth/logout`

🔒 **Requires Bearer token.**

**Success response (200):**
```json
{ "success": true, "data": { "message": "Logged out" } }
```

---

## Routing & Navigation

### `POST /api/route/directions`

Step-by-step walking or vehicle directions between two points.

**Request body:**
```json
{
  "origin": { "lat": 6.8199, "lng": 3.4564 },
  "destination": { "lat": 6.8102, "lng": 3.4568 },
  "mode": "walking"
}
```
- `mode` — `"walking"` (default) or `"vehicle"`

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "routeId": "uuid-or-straight-line",
    "mode": "walking",
    "distanceMeters": 1082,
    "durationSeconds": 778,
    "waypoints": [
      { "lat": 6.8199736, "lng": 3.456378 },
      { "lat": 6.8176968, "lng": 3.4573852 },
      { "lat": 6.8102389, "lng": 3.4568128 }
    ],
    "steps": [
      { "instruction": "Head south for 254m", "distance_meters": 254 },
      { "instruction": "Turn left and walk 120m heading southeast", "distance_meters": 120 },
      { "instruction": "Continue straight for 180m heading south", "distance_meters": 180 }
    ]
  }
}
```

> **Note:** If no pre-traced route exists between the two points, the API returns a straight-line fallback with bearing and distance. The `routeId` will be `"straight-line"` in that case.

---

### `GET /api/route/nearest`

Find the nearest facilities of a given type to the user's location.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `lat` | float | Yes | User's latitude |
| `lng` | float | Yes | User's longitude |
| `type` | string | No | Filter by type: `medical`, `commerce`, `finance`, `accommodation`, `religion`, `parking`, `education`, `services`, `recreation`, `residential` |
| `limit` | integer | No | Max results, defaults to 3, max 20 |

**Example:** `GET /api/route/nearest?lat=6.817&lng=3.457&type=medical&limit=3`

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "facilities": [
      {
        "id": "uuid",
        "name": "RCCG Health Center",
        "type": "medical",
        "description": "RCCG Health Center - medical",
        "lat": 6.816092,
        "lng": 3.453651,
        "distance_meters": 482
      }
    ]
  }
}
```

---

### `GET /api/route/search`

Search POIs by name or keyword. Matches against name, aliases, and description.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `q` | string | Yes | Search query, e.g. `"medical"`, `"bank"`, `"glory arena"` |
| `limit` | integer | No | Defaults to 10, max 50 |

**Example:** `GET /api/route/search?q=medical&limit=5`

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "query": "medical",
    "results": [
      {
        "id": "uuid",
        "name": "RCCG Health Center",
        "type": "medical",
        "description": "RCCG Health Center - medical",
        "lat": 6.816092,
        "lng": 3.453651
      }
    ]
  }
}
```

---

### `POST /api/route/emergency`

Fastest vehicle-only route between two points. Same as `/directions` but forces `mode: "vehicle"`.

**Request body:**
```json
{
  "origin": { "lat": 6.817, "lng": 3.457 },
  "destination": { "lat": 6.810, "lng": 3.456 }
}
```

**Response:** Same shape as `/api/route/directions`.

---

### `POST /api/route/supply`

Optimised multi-stop delivery route using nearest-neighbor heuristic.

**Request body:**
```json
{
  "origin": { "lat": 6.8199, "lng": 3.4564 },
  "stops": [
    { "lat": 6.810, "lng": 3.456 },
    { "lat": 6.816, "lng": 3.453 },
    { "lat": 6.807, "lng": 3.461 }
  ]
}
```

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "routeId": "supply-route-optimized",
    "orderedStops": [
      { "lat": 6.816, "lng": 3.453 },
      { "lat": 6.810, "lng": 3.456 },
      { "lat": 6.807, "lng": 3.461 }
    ],
    "totalDistanceMeters": 1840,
    "totalDurationSeconds": 1324,
    "legs": [
      {
        "from": { "lat": 6.8199, "lng": 3.4564 },
        "to": { "lat": 6.816, "lng": 3.453 },
        "distanceMeters": 620,
        "durationSeconds": 446,
        "steps": [
          { "instruction": "Head southwest for 620m", "distance_meters": 620 }
        ]
      }
    ]
  }
}
```

---

## USSD

### `POST /api/ussd/webhook`

Africa's Talking USSD callback handler. **Response is plain text, NOT JSON.**

**Request body** (form-encoded by Africa's Talking):
| Field | Type | Notes |
|---|---|---|
| `sessionId` | string | AT session ID |
| `phoneNumber` | string | Caller's phone number |
| `text` | string | All inputs joined by `*`. Empty on first request |

**Response:** Plain text prefixed with `CON` (session continues) or `END` (session finished).

```
CON Welcome to CampNav
Reply:
1. Find facility
2. Find zone
3. Lost person
4. Emergency
```

---

## Shuttle Bus Tracking

### `POST /api/shuttles/checkin`

Driver checks in their current location. No auth required.

**Request body:**
```json
{
  "shuttleId": "BUS-07",
  "driverName": "Ade",
  "lat": 6.81765,
  "lng": 3.41675,
  "zone": "A",
  "passengerLoad": 32
}
```
- `driverName`, `zone`, `passengerLoad` are all optional

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "shuttleId": "BUS-07",
    "driverName": "Ade",
    "lat": 6.81765,
    "lng": 3.41675,
    "zone": "A",
    "passengerLoad": 32,
    "checkedInAt": "2026-06-18T10:32:00.000Z"
  }
}
```

---

### `GET /api/shuttles/active`

All active shuttle positions for the dashboard map. Returns the **latest check-in** per shuttle.

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "shuttles": [
      {
        "shuttleId": "BUS-07",
        "driverName": "Ade",
        "lat": 6.81765,
        "lng": 3.41675,
        "zone": "Zone A",
        "passengerLoad": 32,
        "lastCheckin": "2026-06-18T10:32:00.000Z"
      }
    ]
  }
}
```

---

## Lost Person Reports

### `POST /api/lost-persons`

Submit a lost person report. No auth required (visitors can submit).

**Request body:**
```json
{
  "description": "Boy, 8, red shirt, last seen near Gate 3",
  "name": "Tunde",
  "reporterName": "Mrs Adebayo",
  "reporterPhone": "0801234567",
  "lastSeenLocation": "Zone B feeding point",
  "lat": 6.817,
  "lng": 3.457,
  "source": "app"
}
```
- Only `description` is required. All other fields are optional.
- `source`: `"app"` (default), `"ussd"`, or `"dashboard"`

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tunde",
    "description": "Boy, 8, red shirt, last seen near Gate 3",
    "reporterName": "Mrs Adebayo",
    "reporterPhone": "0801234567",
    "lastSeenLocation": "Zone B feeding point",
    "lat": 6.817,
    "lng": 3.457,
    "source": "app",
    "status": "open",
    "createdAt": "2026-06-18T11:05:00.000Z"
  }
}
```

---

### `GET /api/lost-persons`

🔒 **Requires Bearer token.**

List all lost person reports for the dashboard. Supports filtering and pagination.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | Filter: `open`, `in_progress`, `resolved`. Omit for all |
| `limit` | integer | No | Defaults to 50, max 100 |
| `offset` | integer | No | Pagination offset, defaults to 0 |

**Example:** `GET /api/lost-persons?status=open&limit=10&offset=0`

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "reports": [
      {
        "id": "uuid",
        "name": "Tunde",
        "description": "Boy, 8, red shirt",
        "reporterName": "Mrs Adebayo",
        "reporterPhone": "0801234567",
        "lastSeenLocation": "Zone B feeding point",
        "lat": 6.817,
        "lng": 3.457,
        "source": "app",
        "status": "open",
        "resolvedAt": null,
        "createdAt": "2026-06-18T11:05:00.000Z",
        "updatedAt": "2026-06-18T11:05:00.000Z"
      }
    ]
  }
}
```

---

### `PATCH /api/lost-persons/:id/status`

🔒 **Requires Bearer token.**

Update a lost person report's status.

**Request body:**
```json
{
  "status": "resolved"
}
```
- Status values: `"open"`, `"in_progress"`, `"resolved"`

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolvedAt": "2026-06-18T14:30:00.000Z",
    "updatedAt": "2026-06-18T14:30:00.000Z"
  }
}
```

**Error (404):**
```json
{ "success": false, "error": { "code": "LOST_PERSON_REPORT_NOT_FOUND", "message": "Lost person report not found" } }
```

---

## Activity Logs

### `GET /api/logs`

🔒 **Requires Bearer token.**

Activity log for the dashboard. Shows shuttle check-ins, lost person reports, and status changes.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | integer | No | Defaults to 50, max 200 |

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "type": "shuttle_checkin",
        "description": "BUS-07 checked in",
        "timestamp": "2026-06-18T10:32:00.000Z",
        "metadata": { "shuttle_id": "BUS-07", "lat": 6.81765, "lng": 3.41675 }
      },
      {
        "type": "lost_person_report",
        "description": "New lost person report: Boy, 8, red shirt",
        "timestamp": "2026-06-18T11:05:00.000Z",
        "metadata": { "report_id": "uuid", "source": "app", "status": "open" }
      }
    ]
  }
}
```

---

## Health Check

### `GET /api/health`

Health check — frontend can use this to detect offline mode.

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "campnav-backend",
    "database": "ok",
    "timestamp": "2026-06-18T10:00:00.000Z"
  }
}
```

If the database is unreachable, `status` and `database` will be `"degraded"` (still returns 200).

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Missing or wrong type in request body/query |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `MISSING_BEARER_TOKEN` | 401 | No `Authorization: Bearer` header |
| `INVALID_BEARER_TOKEN` | 401 | Token expired or invalid |
| `NOT_FOUND` | 404 | Route not found |
| `LOST_PERSON_REPORT_NOT_FOUND` | 404 | Report ID doesn't exist |
| `INTERNAL_SERVER_ERROR` | 500 | Something unexpected went wrong |

---

## POI Types in Database

These are the `type` values you can use for filtering in `/api/route/nearest`:

| Type | Count | Examples |
|---|---|---|
| `accommodation` | 13 | Kindness Hostel, Bethel Suites, Senior Pastors Lodge |
| `religion` | 6 | Glory Arena, Open Heavens, Halleluyah House |
| `residential` | 5 | Goshen Estate, Pastor's Quarter |
| `commerce` | 4 | CRM SuperMarket, Canaan Land Market, RCCG City Kitchen |
| `finance` | 3 | GT Bank, Access Bank, Conoil Filling Station |
| `medical` | 3 | RCCG Health Center, Redeemer's Health Center, RCCG Maternity Center |
| `parking` | 3 | Car Park C, Car Park V |
| `services` | 3 | Police, Post Office, Mechanic Workshop |
| `education` | 2 | Peaceville School, Bible College |
| `recreation` | 1 | Emmanuel Park |
