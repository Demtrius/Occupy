# Occupy

**Mobile:** Expo (React Native + TypeScript, pnpm, Turborepo)
**Backend:** FastAPI (Python), PostgreSQL, Redis, MinIO, Docker, **Poetry**
**Dev Tooling:** **Biome** (TS lint & format), **Ruff** (py lint), **mypy** (py type-check)

**Goal:** Help small business owners list services & availability, get bookings, post updates, and chat with clients. Users can follow businesses, like/comment on posts, book time slots, and leave reviews.

---

## Features

- **Accounts & Auth**
  - Email/password + social (Apple/Google via `expo-auth-session`)
  - Two roles: **Business** and **User**
- **Business pages**
  - Services (title, duration, price, buffer)
  - Availability (recurring rules + exceptions)
  - Bookings (create/cancel/reschedule)
  - Posts (text + images), Likes, Comments
  - Reviews (only after completed booking)
- **Social**
  - Follow businesses; see a simple feed (reverse-chrono of followed businesses)
- **Chat**
  - 1:1 Business ↔ User, typing/presence, read receipts (WebSockets)
- **Files**
  - Image uploads via **pre-signed URLs** to **MinIO** (S3-compatible)

---

## Tech Stack

### Mobile (Expo)
- React Native (Expo, managed workflow), TypeScript, `expo-router`
- Styling: `nativewind` (Tailwind for RN)
- Components: `react-native-paper`
- Data: **TanStack Query** for server cache + **Zustand** for local state
- Forms: `react-hook-form` + `zod`
- Dates: `dayjs`, booking calendar with `react-native-calendars`
- Media: `expo-image`, `expo-image-picker`, pre-signed upload flow
- Notifications: `expo-notifications`
- Testing (later): **Maestro** for e2e

### Backend (FastAPI)
- FastAPI, Starlette
- DB: PostgreSQL (`asyncpg`), **SQLAlchemy 2.x (async)**, **Alembic**
- Cache & Realtime: Redis (pub/sub, presence, rate-limiting buckets)
- Jobs/Workers: **Dramatiq** (Redis broker)
- Auth: JWT (access+refresh via `python-jose`), Argon2 password hashing
- Validation: **Pydantic v2**
- Search/Geo: Postgres FTS + `pg_trgm`, **PostGIS** (optional for MVP)
- File storage: **MinIO** (S3 API) via `boto3` pre-signed URLs
- Observability: `sentry-sdk`, OpenTelemetry (optional initially)
- Email: `fastapi-mail` (any SMTP/Postmark/SendGrid)

### Tooling & Repo
- **pnpm** + **Turborepo** monorepo
- **Biome** for TS lint/format (no ESLint/Prettier)
- **Ruff** for Python lint, **mypy** for static typing
- **Poetry** for Python dep & env management
- Docker Compose for local: `api`, `db`, `redis`, `minio`, `worker`, `nginx`
- CI: GitHub Actions (lint, typecheck, tests, build, migrations)

---

## Monorepo Layout

```
├─ apps/
│ ├─ mobile/ # Expo app
│ └─ api/ # FastAPI app
├─ packages/
│ ├─ ui/ # Shared RN components (buttons, cards)
│ ├─ config/ # Shared tsconfig/eslint/prettier
│ └─ types/ # OpenAPI TS client (generated)
├─ infra/
│ ├─ docker/ # Dockerfiles & compose
│ └─ db/ # migrations, seed, sql snippets
├─ turbo.json
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```
