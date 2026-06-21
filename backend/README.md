# CampNav Backend

Express + TypeScript API for routing, USSD, dashboard auth, shuttle check-ins, lost-person reports, logs, and health checks.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs on `http://localhost:3001` by default.

## PostgreSQL

Create a PostgreSQL database, then update `DATABASE_URL` in `.env`.

```bash
createdb campnav
npm run db:migrate
npm run db:seed
```

The first migration creates:

- `users`
- `zones`
- `pois`
- `roads`
- `shuttle_checkins`
- `lost_person_reports`
- `logs`
- `schema_migrations`

The initial schema intentionally uses plain PostgreSQL coordinates (`lat`, `lng`) and GeoJSON stored in `jsonb`, so local development does not require PostGIS to be installed on the database server. PostGIS can be added later when the deployment database supports it.

## Scripts

- `npm run dev` - start the development server with watch mode.
- `npm run build` - compile TypeScript to `dist/`.
- `npm start` - run the compiled server.
- `npm run db:migrate` - apply pending SQL migrations.
- `npm run db:seed` - insert demo admin, zones, POIs, roads, and a seed log entry.
- `npm run typecheck` - validate types without emitting files.
- `npm run lint` - run ESLint over `src/`.

## Route Groups

- `POST /api/route/directions`
- `GET /api/route/nearest`
- `GET /api/route/search`
- `POST /api/route/emergency`
- `POST /api/route/supply`
- `POST /api/ussd/webhook`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/shuttles/checkin`
- `GET /api/shuttles/active`
- `POST /api/lost-persons`
- `GET /api/lost-persons`
- `PATCH /api/lost-persons/:id/status`
- `GET /api/logs`
- `GET /api/health`

All responses use the contract shape:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```
