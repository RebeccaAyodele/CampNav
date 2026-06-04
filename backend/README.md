# CampNav Backend

Express + TypeScript API for routing, USSD, dashboard auth, shuttle check-ins, lost-person reports, logs, and health checks.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:3001` by default.

## Scripts

- `npm run dev` - start the development server with watch mode.
- `npm run build` - compile TypeScript to `dist/`.
- `npm start` - run the compiled server.
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
