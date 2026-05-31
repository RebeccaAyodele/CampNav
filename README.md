
# CampNav

**Offline-first navigation and logistics coordination for Redemption City.**

CampNav helps visitors find their way around Redemption City during RCCG programmes — no internet required. It also gives camp administrators tools to coordinate shuttle buses, emergency response, and supply distribution in real time.

Built for Kingdom Hack 3.0 (Logistics Track).

---

## The Problem

Redemption City hosts between 500,000 and 5 million visitors per programme. The camp has no dedicated navigation system, GSM coverage fails under that load, and a large portion of attendees use basic feature phones that cannot run smartphone apps. People get lost. Families separate. Medical response is delayed. Logistics runs on instinct.

CampNav fixes that.

---

## What It Does

**For visitors on smartphones**
- Offline map of Redemption City built from a custom GeoJSON dataset
- Natural language search — type how you actually speak, not how a map labels things
- Step-by-step walking directions that work with zero internet
- Available in English, Yoruba, Igbo, Hausa, and French

**For visitors on feature phones**
- Full navigation via USSD — dial a short code, no app needed, no internet needed
- Find facilities, get text directions, report a lost person, access emergency contacts
- Works on any phone with an active SIM card

**For camp administrators and coordinators**
- Web dashboard showing shuttle bus positions updated via driver check-ins
- Emergency vehicle routing across the camp road network
- Supply route optimisation for multi-stop deliveries
- Lost person report feed from both the app and USSD in real time
- Everything works offline and syncs when connectivity returns

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (visitor app + dashboard) | Next.js, TypeScript, MapLibre GL JS |
| Camp map data | Custom GeoJSON (hand-traced from satellite imagery) |
| Search | Fuse.js fuzzy matching |
| Routing engine | Dijkstra over GeoJSON road network (Python / FastAPI) |
| USSD gateway | Africa's Talking API |
| Dashboard backend | Node.js / Express |
| Database | PostgreSQL with PostGIS |
| i18n | next-i18next (static locale files, no live translation API) |
| Hosting | Vercel (frontend) + Railway (backends) |

---

## Repository Structure

```
campnav/
├── frontend/             Next.js visitor app and admin dashboard (PWA)
├── backend-python/       FastAPI routing engine and USSD webhook (Temi)
├── backend-node/         Express API for dashboard, check-ins, sync (Tolu)
├── map-data/             GeoJSON files for Redemption City camp layout
└── docs/                 Architecture diagrams and API contracts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL with PostGIS extension

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend (Python)

```bash
cd backend-python
pip install -r requirements.txt
uvicorn main:app --reload
```

### Backend (Node.js)

```bash
cd backend-node
npm install
npm run dev
```

### Environment variables

Copy `.env.example` to `.env` in each service directory and fill in the values.

Required variables:

```
# backend-python
DATABASE_URL=
AT_API_KEY=         # Africa's Talking API key
AT_USERNAME=        # Africa's Talking username

# backend-node
DATABASE_URL=
PYTHON_API_URL=     # URL of the running FastAPI service
```

---

## Map Data

The camp GeoJSON files live in `map-data/`. The dataset covers zone boundaries, internal roads, gates, medical posts, toilets, ATMs, feeding areas, bathing facilities, and programme venues.

To update or extend the map, open the relevant GeoJSON file in [geojson.io](https://geojson.io) and edit directly. Keep the property schema consistent:

```json
{
  "type": "Feature",
  "properties": {
    "name": "Zone A Medical Post",
    "type": "medical",
    "zone": "A",
    "description": "Near Gate 3, open 24hrs during programmes"
  },
  "geometry": { ... }
}
```

---

## Team

| Name | Role |
|---|---|
| Becca | Frontend — visitor app, map rendering, NLP search, multilingual UI |
| Temi | Backend — routing engine, USSD integration (Python) |
| Tolu | Backend — dashboard, check-ins, logistics API (Node.js) |

---

## Status

Currently in active development for Kingdom Hack 3.0.
Build window: May 28 to June 20, 2026.
Demo Day: June 27, 2026.

---

*Built for a problem we have lived, not one we imagined.*