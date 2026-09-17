# Aegis — Pre-Disaster Detector & Emergency Management System

Version 1.4 adds the Neuro-Sync Response™ prototype and retains the secure, progressive Vue 3 integration in the authenticated Command Center.

**Predict · Prepare · Protect**

Aegis is a secure academic full-stack emergency-management prototype. It integrates the supplied Full Stack Web Development practical requirements into realistic product features instead of exposing separate "practical demo" pages.

> **Safety:** all predictions, incidents, alerts, team states and SOS actions in this project are simulated/educational. Aegis does not contact real emergency services. In a real emergency in India, use official channels such as **112**.

## What is implemented

- Multi-page public site + authenticated command center
- Node.js + Express REST backend
- Atomic JSON-file persistence using Node `fs`
- Registration, login, logout and protected pages
- bcrypt password hashing
- JWT in an HttpOnly, SameSite=Strict cookie
- Role-based authorization (`citizen`, `operator`, `admin`)
- Input validation and server-side enum/field whitelisting
- API/auth rate limits and browser mutation-origin guard
- Security headers + Content Security Policy
- Geolocation with denial/timeout/unavailable handling and manual fallback
- Location-aware shelters and distance sorting
- Leaflet/OpenStreetMap hazard/resource map using locally installed Leaflet
- Hazard, severity, distance and resource filters
- Disaster, shelter, hospital, police, fire-station and assembly-point markers
- Simulated evacuation plan with shelter selection, approximate distance and route line
- Explainable validated pre-disaster risk detector
- Alerts: filter/search/sort/read/pin/dismiss
- Simulated SOS with confirmation, coordinates, emergency type, contact and status tracking
- Preparedness checklist: add/edit/complete/delete/filter/progress
- Backend task persistence + Local Storage cache
- Five-stage HTML5 Drag & Drop incident board
- Response-team assignment and status controls
- Notification read/unread, mark-all-read and delete
- Editable user profile + preparedness score
- Theme, location privacy, accessibility and notification settings
- Chart.js analytics for six operational views
- Responsive mobile drawer/navigation, touch-friendly controls and accessible focus states
- Bootstrap 5 **online/CDN** registration page
- Bootstrap 5 **offline/npm** emergency resources page
- Tailwind CSS 4 locally compiled for login and command-center pages; the Play CDN is isolated to the public awareness exercise
- Responsive `<picture>` images, width/max-width, viewport units and media queries
- Browser diagnostics page with legitimate embedded JavaScript
- Node/JSON academic scripts for Practicals 1–2

## Quick start

Requirements: **Node.js 18+**.

```bash
npm install
npm run build
npm test
npm start
```

Open:

```text
http://localhost:3000
```

`npm run build` recompiles the local Tailwind stylesheet and then performs dependency-independent syntax, JSON, HTML, XSS-regression, CSP and academic-structure checks.

### Local-development demo operator

```text
Email: demo@aegis.local
Password: Demo@123
```

The demo account is automatically seeded **only outside production** unless `SEED_DEMO_USER=false` is set. Production mode never auto-seeds the predictable public demo user.

## Production security

Set at least:

```text
NODE_ENV=production
JWT_SECRET=<random secret of at least 32 characters>
CLIENT_URL=https://your-real-origin.example
```

Aegis refuses to start in production if `JWT_SECRET` is missing or too short.

Do not commit `.env` or mutable personal-data files. `.gitignore` excludes them.

## Commands

```bash
npm run dev          # start Express in development mode
npm run build        # syntax/JSON/HTML/security regression checks
npm test             # integration tests using Node's test runner
npm run check        # academic + structural self-check
npm run hello        # Practical 1: Hello world
npm run json-write   # Practical 1: write JSON with fs
npm run json-display # Practical 2: display JSON object
npm run json-read    # Practical 2: read external JSON file
npm run json-matrix  # Practical 2: multidimensional JSON array
```

## Vue.js integration

The `/app/dashboard` route is powered by Vue 3 using the locally installed runtime build (no third-party CDN). It demonstrates `createApp`, Composition API state with `ref`, derived state with `computed`, lifecycle hooks, event handling, conditional rendering, list rendering, API loading, and reactive refresh/error states. Express serves Vue from `/vendor/vue`, so the existing Content Security Policy remains strict.

## Neuro-Sync Response™ prototype

Open `/app/neuro-sync` after signing in. The judge-demo flow includes:

- weighted distress-keyword classification, coordinate extraction and server-side SSIM;
- a clickable mesh topology with Dijkstra rerouting and animated packet flow;
- local HR/EDA simulation with a Vue reactive high-stress state listener;
- an OLED-black minimal exit HUD for cognitive-load reduction;
- a full-duplex WebSocket system-health feed and explicit local-only biometric indicator.

Satellite pixels, MQTT status, IEEE 802.11s peers and wearable vitals are simulated. The verification logic, SSIM calculation, route calculation, WebSocket connection and adaptive UI are executable. Raw simulated vital samples remain in browser memory and are never posted to the server.

## Public routes

- `/`
- `/about`
- `/awareness`
- `/resources`
- `/login`
- `/register`
- `/system-check`
- `/health`

## Authenticated application routes

- `/app/dashboard`
- `/app/map`
- `/app/risk`
- `/app/alerts`
- `/app/sos`
- `/app/shelters`
- `/app/evacuation`
- `/app/preparedness`
- `/app/incidents`
- `/app/teams`
- `/app/analytics`
- `/app/notifications`
- `/app/profile`
- `/app/settings`

## REST API

Authentication/profile:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`

Situational awareness:

- `GET /api/dashboard`
- `GET /api/disasters`
- `GET /api/disasters/:id`
- `GET /api/alerts`
- `GET /api/alerts/:id`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/mark-all-read`
- `GET /api/resources`
- `GET /api/shelters`
- `GET /api/shelters/nearby?lat=&lon=&radius=`
- `POST /api/risk`

Response operations:

- `GET /api/incidents`
- `POST /api/incidents` — operator/admin
- `PATCH /api/incidents/:id` — operator/admin
- `GET /api/teams`
- `PATCH /api/teams/:id` — operator/admin
- `GET /api/sos`
- `POST /api/sos`
- `PATCH /api/sos/:id` — operator/admin

Personal workflow:

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/notifications`
- `PATCH /api/notifications/:id`
- `DELETE /api/notifications/:id`
- `POST /api/notifications/mark-all-read`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/analytics`

Unknown `/api/*` routes return a JSON 404 rather than an HTML page.

## Architecture

```text
Aegis-Pre-Disaster-Emergency-System/
├── data/                  # seed/runtime JSON
├── docs/                  # academic requirement mapping
├── public/
│   ├── app/               # authenticated HTML pages
│   ├── assets/            # responsive local imagery
│   ├── css/               # shared responsive design system
│   └── js/
│       ├── pages/         # page controllers
│       ├── app.js         # shared command-center shell/mobile drawer
│       ├── auth.js
│       └── common.js
├── scripts/               # academic scripts + build/self-check
├── server/
│   ├── middleware/        # auth/security
│   ├── routes/            # auth + application REST APIs
│   ├── services/          # risk model
│   └── utils/             # atomic store + validation
├── tests/                 # integration tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`server/utils/store.js` performs atomic temp-file + rename writes and a small lock file around mutations. Invalid existing JSON is reported as an error and is **not silently replaced with an empty fallback**.

## Seed data

The project ships with enough simulated data for a complete first run:

- 16 disaster events
- 12 shelters
- 12 alerts
- 8 response teams
- 10 incidents
- hospitals, police, fire stations and assembly points
- notification seed data

## Security and completeness fixes included in v1.2

- Removed predictable JWT fallback secret
- Disabled automatic public demo seeding in production
- Replaced timestamp-only generated IDs with `crypto.randomUUID()`
- Removed incident mass-assignment and added explicit field/enum whitelisting
- Removed unsafe rendering of incident type/severity; dynamic UI uses `textContent`/DOM nodes
- Added role authorization for operational mutations
- Enforced valid incident/SOS workflow transitions, team availability checks and automatic team release on resolution
- Added per-user alert/read/pin/dismiss state and notification visibility controls
- Added API and authentication rate limiting
- Added browser mutation-origin protection and SameSite=Strict cookies
- Added security headers/CSP
- Isolated third-party Tailwind Play CDN execution to the public awareness page; authenticated pages use locally compiled Tailwind CSS
- Added explicit `TRUST_PROXY` configuration instead of trusting forwarded IP headers by default
- Added `Cache-Control: no-store` on authentication and protected application responses
- Added atomic/locked JSON writes and corruption protection
- Added `.gitignore` for `.env`, dependencies and mutable personal/runtime data
- Added API JSON 404 and dedicated 500 UI
- Fixed risk-model invalid-input behavior
- Fixed mobile navigation with a real drawer
- Fixed Remember Email removal behavior
- Added full Practical 6 preparedness-reference form with title, author, publisher, year, ISBN/reference ID and quantity
- Added real local Tailwind compilation with a committed prebuilt stylesheet
- Pinned direct dependency versions exactly; keep the `package-lock.json` generated by `npm install` when committing/deploying
- Added meaningful build and integration-test commands

See `docs/PRACTICAL-MAPPING.md` for viva mapping.
