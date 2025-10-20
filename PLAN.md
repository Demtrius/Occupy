
# Project Plan & Milestones

This plan is designed to ship a usable MVP quickly while keeping room for growth. Each milestone has deliverables, acceptance criteria, and suggested tasks.

---

## Milestone 0 — Repo & Infra Bootstrap (1–2 days)

**Deliverables**
- Turborepo + pnpm monorepo scaffolding
- Docker Compose (Postgres, Redis, MinIO, API, Worker, Nginx)
- FastAPI app skeleton with health check
- Expo app skeleton with `expo-router`

**Acceptance Criteria**
- `docker compose up` brings up infra, API reachable at `http://localhost:8000/health`
- `expo start` runs app; mobile can hit API health endpoint

**Tasks**
- [ ] Init repo (`pnpm`, `turbo`, workspace config)
- [ ] Add linting/formatting (ESLint, Prettier, Ruff)
- [ ] Compose files + Dockerfile for API
- [ ] MinIO bucket creation job
- [ ] API health route & OpenAPI docs
- [ ] Expo starter with env wiring
- [ ] CI: lint + typecheck pipelines

---

## Milestone 1 — Auth & Accounts (2–3 days)

**Deliverables**
- Email/password auth with JWT (access+refresh), Argon2
- Models: `User`, `Profile` (role: `user | business`)
- Minimal settings/profile edit

**Acceptance Criteria**
- Register/login/refresh works via REST
- Protected route accessible with access token; refresh rotates correctly
- Expo app: register → login → see profile

**Tasks**
- [ ] SQLAlchemy models + Alembic migration
- [ ] `/auth/register`, `/auth/login`, `/auth/refresh`, `/me`
- [ ] Password policy + server-side validation
- [ ] Client forms with `react-hook-form` + `zod`
- [ ] Secure token storage (in-memory + refresh flow)

---

## Milestone 2 — Business Pages & Services (2–3 days)

**Deliverables**
- Entities: `Business` (FK owner), `Service` (duration, price, buffer)
- Business CRUD for owners; public read endpoint
- Media uploads (logo/cover) via **MinIO** pre-signed URLs

**Acceptance Criteria**
- Business owner can create/update their business and services
- Public can view business profile + services list
- Upload flow: get pre-signed URL → PUT image → confirm metadata

**Tasks**
- [ ] `/businesses` POST/PATCH/GET
- [ ] `/services` POST/GET
- [ ] S3 pre-sign endpoints (`/uploads/presign`, `/media`)
- [ ] Client screens: Business editor, Services editor, Business view

---

## Milestone 3 — Availability & Slot Generation (3–4 days)

**Deliverables**
- Availability model (RRULE + exceptions + optional explicit ranges)
- Slot generator job (Dramatiq) producing bookable intervals
- Endpoint to query slots per business/service

**Acceptance Criteria**
- Given RRULEs (e.g., Mon–Fri 09:00–17:00) + duration/buffer → API returns slots
- Ex-dates (holidays) and overlaps handled
- Timezone-safe (store UTC; display local on client)

**Tasks**
- [ ] Models: `Availability`, helpers for RRULE/EXDATE
- [ ] Worker: slot generation & cache in Redis
- [ ] `GET /businesses/:id/slots?serviceId&from&to`
- [ ] Client calendar to pick date/time

---

## Milestone 4 — Bookings (3–4 days)

**Deliverables**
- Booking create/cancel/reschedule; status: `pending|confirmed|completed|cancelled`
- Idempotency keys to prevent double-booking
- Notifications (email + optional push)

**Acceptance Criteria**
- User can book a service in a visible slot
- Double-book prevention works under concurrency
- Cancellation/reschedule rules respected (simple cutoff for MVP)

**Tasks**
- [ ] Model: `Booking`
- [ ] Endpoints: create, get mine, cancel, reschedule
- [ ] Redis locks or DB constraints for overlap
- [ ] Push/email plumbing

---

## Milestone 5 — Reviews (1–2 days)

**Deliverables**
- Post-booking reviews (`rating`, `text`), 1 review per completed booking
- Aggregate rating on Business

**Acceptance Criteria**
- Only users with **completed** bookings can review
- Business page shows average rating & recent reviews

**Tasks**
- [ ] `POST /bookings/:id/review`, `GET /businesses/:id/reviews`
- [ ] DB trigger or periodic job to update aggregates
- [ ] Client review form & display

---

## Milestone 6 — Posts, Likes, Comments (2–3 days)

**Deliverables**
- Business posts (text + images), like & comment
- Public business timeline
- Simple **Feed** for users (followed businesses, reverse-chrono)

**Acceptance Criteria**
- Business can create posts with images (MinIO upload)
- Users can like/comment
- Users see a feed of followed businesses

**Tasks**
- [ ] Models: `Post`, `Like`, `Comment`, `Follow`
- [ ] Endpoints: CRUD post, like/unlike, comment, follow/unfollow, `GET /feed`
- [ ] Client: Post composer, Post card, Feed screen, Follow button

---

## Milestone 7 — Chat (Realtime) (3–5 days)

**Deliverables**
- 1:1 chat between Business and User
- WebSocket channels, Redis pub/sub
- Client: Custom chat UI (message list, composer, typing, read receipts)

**Acceptance Criteria**
- Messages appear in realtime across devices
- Read receipts & typing indicator functional
- Offline-first: messages cached locally; retry on reconnect

**Tasks**
- [ ] Models: `Chat`, `Message`, `Participant`
- [ ] REST: list chats, paginate messages, post message
- [ ] WS: `ws/chat?chatId=...`, rooms, presence, typing events
- [ ] Client: custom components (bubble, input, list, status)
- [ ] Delivery receipts + read-at timestamps

---

## Milestone 8 — Polish & Guardrails (1–2 days)

**Deliverables**
- Rate limiting (`slowapi`)
- Basic content moderation (bad-words filter)
- Empty/error/loading states, analytics events scaffolding

**Acceptance Criteria**
- API denies abusive rates (auth, booking, posts)
- UI shows friendly blanks and retry pathways

**Tasks**
- [ ] Middleware configs
- [ ] Centralized error handling / toasts
- [ ] Basic telemetry hooks

---

## Milestone 9 — (Optional) Payments & Calendar Sync

**Deliverables**
- Stripe (later) for deposits/holds; ICS export for calendar viewing
- Out of MVP; keep schema-ready (booking payment_ref)

---

## Cross-Cutting Work

- **CI/CD**
  - [ ] GitHub Actions: lint/typecheck/test on PR
  - [ ] Build Docker images on main
- **Security**
  - [ ] JWT rotation, Argon2, CORS, request IDs
  - [ ] Secrets management (dotenv for dev)
- **Docs**
  - [ ] OpenAPI accuracy; generate TS client via `orval` into `packages/types`
- **Testing**
  - API: pytest happy-paths per milestone
  - Mobile: later add **Maestro** flows
    - [ ] Auth flow
    - [ ] Book a slot
    - [ ] Chat send/receive

---

## Schema Sketch (MVP)

- `users` (id, email, password_hash, role, created_at)
- `profiles` (user_id FK, display_name, avatar_url, bio)
- `businesses` (id, owner_id FK, name, bio, location, cover_url, rating_avg)
- `services` (id, business_id FK, title, duration_min, price_minor, buffer_min)
- `availability` (id, business_id FK, rrule, exdates[], timezone, tz_offset_hint)
- `slots` (id, business_id, service_id, start_ts, end_ts, is_booked)  _materialized_
- `bookings` (id, user_id, service_id, start_ts, end_ts, status, payment_ref, created_at)
- `reviews` (id, booking_id FK, rating, text, created_at)
- `posts` (id, business_id, body, media_urls[], created_at)
- `likes` (user_id, post_id, created_at)
- `comments` (id, post_id, user_id, body, created_at)
- `follows` (follower_user_id, business_id, created_at)
- `chats` (id, business_id, user_id, created_at)
- `messages` (id, chat_id, sender_id, body, media_urls[], sent_at, read_at)
- `media` (id, owner_id, url, kind, created_at)

---

## Definition of Done (per milestone)

- ✅ API endpoints documented in OpenAPI & tested (unit/integration)
- ✅ DB migrations added & idempotent
- ✅ Mobile screens/components wired to live API with error states
- ✅ Basic accessibility (labels, hit targets) & responsiveness
- ✅ No PII/secrets committed; `.env.example` updated

---

## Backlog / Future Ideas

- Staff & multi-resource scheduling (per-staff calendars)
- Waitlists & smart slot-filling
- No-show protection & dispute flows
- Advanced discovery (categories, distance, price filter, rating)
- In-app analytics for businesses (views → bookings funnel)
- Moderation dashboard (reports, hide content)
- Feature flags / remote config
- Push notification campaigns (announce promos to followers)
- GraphQL gateway for complex feed queries
- Offline-first for bookings & posts (queue + sync)

---
