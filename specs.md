# Occupy — Project Description

> Social platform for small business owners to showcase services, manage availability, take bookings, post updates, and chat with clients.

---

## 1) Summary

- **Name:** **Occupy**
- **Tagline:** Bookable communities for local businesses.
- **Brand color:** `#0084d1`
- **Platforms:** iOS & Android (Expo / React Native)
- **Production URL:** `https://occupy-app.com`
- **MVP focus:** Business-led “cliques” where owners post updates, list services, publish availability, accept bookings, and converse with clients. Social graph supports follows, likes, and comments with privacy controls.

---

## 2) Primary Users & Roles

- **Normal account (client):** Discover businesses, follow, request to join private cliques, like/comment posts, book services, chat, leave reviews.
- **Business page (owner):** Create and manage cliques, publish posts, define services, set availability, manage bookings, moderate comments/members, chat with clients, respond to reviews.

---

## 3) Core Features (MVP)

### 3.1 Accounts & Auth

- Email/username + password authentication.
- JWT-based session with access/refresh tokens stored securely on device.
- Email verification **deferred** (post-MVP).
- OAuth providers **planned** (post-MVP).
- Account flags: `is_business_page`, `is_private_account`, `is_admin`, `is_active`.

### 3.2 Profiles & Relationships

- Public or **private profiles**; private profiles require follow requests.
- Follow lifecycle: **request → approve/reject → unfollow**; owner can **block/unblock**.
- Profile includes avatar, bio, username (unique, case-insensitive), occupations.

### 3.3 Cliques (Business Communities)

- Created/owned by a **business page** user.
- **Privacy:** public or private.
- **Membership:** owner, member; join for public is instant; private requires approval (join links supported).
- **Metadata visible to outsiders** even if private: name & description.
- Occupations tagging for discovery.
- **Timezone** at clique level (drives booking windows & slots).

### 3.4 Social Content

- **Posts** authored by the clique owner.
  - Status: draft, posted, archived.
  - Rich text formatting (links, basic emphasis).
  - **Single image** per post (MVP).

- **Reactions:** like/unlike (idempotent).
- **Comments:** top-level + one-level replies (like Instagram/YouTube).
  - **Soft delete** for comments; owner can delete member comments.
  - Post deletion by owner removes from listings.

### 3.5 Services, Availability & Slots

- **Services:** title, description, duration, buffer, `price_minor` (EUR minor units), `is_active`.
- **Availability:**
  - **One-off** by date with start/end.
  - **Recurring** by day-of-week with start/end.
  - Optional valid-from/until window.

- **Slots:** computed from service duration + buffer across availability and existing bookings.

### 3.6 Bookings

- Create booking by selecting a **service** and **slot**.
- **Statuses:** Pending → Confirmed → Completed; Cancelled.
- **Cancellation policy:** owner-defined cutoff (hours); client cannot cancel inside cutoff; owner can cancel anytime with reason.
- **Reschedule:** client may reschedule before cutoff; owner can reschedule administratively (MVP: client path).
- **Notes:** client can attach note at booking time.
- **Visibility:** owner views all bookings for their clique; client views own bookings.

### 3.7 Reviews

- One **review per completed booking** by the booking user.
- Rating 1–5, optional comment.
- Listing per clique with **average rating**.

### 3.8 Messaging

- **1:1 chat** between business owner and client (no group chats).
- Typing indicators and unread counters.
- **Sender delete** within 15 minutes (hard delete).
- **Single image** per message (MVP).

### 3.9 Notifications

- In-app notification center for:
  - like, comment, follow (request/accept), booking request/confirm/cancel, review, **system**

- Mark read / mark all read.
- Push notifications **deferred** (post-MVP).

### 3.10 Search & Discovery

- Unified search across **users, occupations, cliques**.
- Private cliques **appear** in search with **name/description only** (no sensitive fields).

### 3.11 Media

- File storage via object store; **image types:** jpeg, png, webp.
- **Max size:** 10 MB (MVP).
- Upload flow: presign → PUT → register.

---

## 4) Key User Flows

1. **Onboarding & Auth**
   - Register → auto-login → land on feed.
   - Login → token storage → “Me” hydration.
   - Logout clears tokens/state.

2. **Follow & Privacy**
   - Client follows public profile → instant.
   - Client requests private profile → pending → owner approval → access.

3. **Join Clique**
   - Public join: instant.
   - Private join: request → owner approves/rejects (join links supported).

4. **Posts & Interactions**
   - Owner composes post (optional image) → posts → appears in feed.
   - Client likes/unlikes; comments/replies; owner moderates.

5. **Services & Bookings**
   - Client opens clique → services → selects service → sees slots → books.
   - Client reschedules (before cutoff) or requests cancel (enforced).
   - Owner confirms/cancels with reason; client is notified.

6. **Reviews**
   - After completion, client reviews the booking (1–5 + comment).
   - Reviews appear on clique with updated average.

7. **Messaging**
   - Client opens chat with owner → send/receive messages (WS-backed).
   - Delete sent message within 15 minutes.

8. **Search**
   - Search users/occupations/cliques; navigate to result.
   - Private clique shows limited metadata until member.

9. **Media Upload**
   - Avatar or post image: request presign → upload → register → update UI.

---

## 5) Privacy & Access Rules

- **Profiles:** Private profiles hidden from non-followers except minimal metadata (e.g., username).
- **Cliques:** Even if private, **name & description** visible to outsiders/search.
- **Posts:** Visible to members (private cliques) or public (public cliques).
- **Comments/likes:** Only members of the clique can interact on private cliques.
- **Bookings:** Viewable by the **booker** and the **clique owner**.
- **Messaging:** Only between chat participants; no group visibility.
- **Moderation:** Owner can delete comments within their clique; block abusive users (affects follows/visibility).
- **Soft vs Hard delete:** Comments soft-delete; message delete is hard within 15 minutes.

---

## 6) Mobile App Architecture

- **Framework:** Expo + React Native.
- **Routing:** Expo Router v6; deep link scheme `occupy://`.
- **State:** **Zustand**:
  - `auth-store` (tokens, user, hydration)
  - `theme-store` (light/dark/system) with device scheme sync

- **Data fetching & caching:** TanStack Query v5 (retry, cache, stale-time, infinite queries, optimistic updates).
- **Secure storage:** `expo-secure-store` (with AsyncStorage fallback for resilience).
- **Styling:** **@shopify/restyle** (semantic design tokens; dark mode via class toggle).
- **Dates & time:** dayjs (timezones handled by backend; client displays per device/clique context).
- **Testing:**
  - Unit/integration (Jest + Testing Library).
  - E2E: Maestro (local simulators/emulators) with backend Testcontainers harness.

- **Conventions:**
  - **Path alias:** `@/*`
  - **Kebab-case** filenames for packages and apps.
  - Screen skeletons for: auth, feed, cliques, services/bookings, posts, notifications, profile, search, chats.

---

## 7) Backend Architecture

- **Framework:** FastAPI (Python).
- **Persistence:** PostgreSQL (SQLAlchemy), Alembic migrations.
- **Cache/queues:** Redis.
- **Object storage:** MinIO (S3-compatible).
- **Realtime:** WebSocket endpoints for chat & typing indicators.
- **API surface:**
  - REST, JSON, **camelCase** payloads externally (snake_case internal).
  - Standard **error envelope** with machine-readable codes (`forbidden`, `validation_error`, `conflict`, `unauthorized`, etc.).
  - **Cursor-based** pagination for listings.

- **Testing & QA:**
  - pytest + Testcontainers; **≥85%** coverage gate.
  - Product verifier script for end-to-end behaviors & invariants.

- **Security:**
  - JWT auth (access + refresh, rotation).
  - Rate limiting (IP/user buckets; tune per route).
  - Validation with consistent error envelopes.
  - Exclusion constraints for overlapping bookings.

---

## 8) Data Model Overview (Conceptual)

- **User**
  - id, email, username, full_name, bio, profile_image, flags (`is_admin`, `is_active`, `is_private_account`, `is_business_page`)
  - relations: occupations, followers, following

- **Occupation**
  - id, name, slug

- **Follow**
  - follower_user_id, target_user_id, status (pending/accepted/blocked)

- **Clique**
  - id, owner_user_id, name, description, privacy, timezone, occupations, image
  - members (role: owner/member; status: joined/pending/rejected)

- **Post**
  - id, clique_id, author_id (owner), content, status, image, counts (likes/comments)

- **Comment**
  - id, post_id, author_id, body, parent_comment_id (optional), soft-deleted flags

- **Like**
  - user_id, post_id (unique)

- **Service**
  - id, clique_id, title, description, duration, buffer, price_minor, currency, is_active

- **Availability**
  - id, clique_id, is_recurring, date or day_of_week, start_time, end_time, valid_from/until, timezone

- **Booking**
  - id, clique_id, service_id, user_id, start_ts, end_ts, status, cancellation_reason (owner-specified), notes

- **Review**
  - id, booking_id (unique), rater_user_id, rating, comment

- **Chat & Message**
  - chat (business_user_id, client_user_id)
  - message (chat_id, sender_id, body, image, sent_at; hard-delete window)

- **Notification**
  - id, type, actor_id, target_user_id, entity_ref (post/comment/booking/follow), is_read, created_at

- **Media**
  - id, url, mime, size_bytes, meta, owner_id

---

## 9) Environments

- **Development (local):**
  - iOS: API base `http://localhost:8000`
  - Android emulator: API base `http://10.0.2.2:8000`

- **Production:** `https://occupy-app.com` (backing API under same host or `api.occupy-app.com`, to be finalized)
- **Secrets:** Managed via `.env` (local) / platform secrets (prod).
- **Deep links:** `occupy://...` → route mapping for chat, bookings, posts, cliques.

---

## 10) Quality, Performance & Accessibility

- **Mobile performance targets:**
  - Cold start: < 3s on modern devices.
  - Feed first contentful render: < 1.5s on warm cache.
  - Infinite scroll with recycling, minimal over-fetching, image caching.

- **Accessibility:**
  - Provide roles/labels, proper hitSlop, contrast checks for light/dark.
  - Focus and large text support where applicable.

- **Testing targets:**
  - Backend coverage ≥ 85%.
  - Key E2E flows green on iOS (full) and Android (smoke).

---

## 11) Security, Privacy & Compliance (MVP)

- **Transport:** TLS for production.
- **Auth:** JWT with secure storage; refresh rotation.
- **Rate limiting:** Per-route strategy (e.g., auth, searches, messaging).
- **Privacy:** Private profiles/cliques gating; minimal exposure for private entities in search.
- **Data integrity:** Booking overlap exclusion; one-review-per-booking constraint.
- **Content moderation:** Owner comment deletion; user blocking.
- **PII:** Minimal retention; data export/delete **planned** (post-MVP).

---

## 12) Constraints & Assumptions

- Payments & deposits **out of scope** for MVP.
- Push notifications OS-level delivery **deferred**; in-app center exists.
- Media limited to **images** (single image per post/message) up to **10 MB**.
- No group chats; **1:1 only**.
- English-only UI; currency **EUR**.
- Timezone at **clique level**; device display aligns to clique’s configuration where relevant.

---

## 13) Roadmap (Post-MVP)

1. **CI/CD & Observability**
   - GitHub Actions: lint, typecheck, tests, E2E (simulators), artifact uploads.
   - Sentry & OpenTelemetry (traces/metrics), structured logging, request IDs.

2. **Store Readiness**
   - App icons/splash, metadata, privacy nutrition labels, localization scaffolding.
   - Feature flags for risky features.

3. **Analytics & Growth**
   - Privacy-friendly analytics, funnel tracking (onboarding, follow, booking, message, review).
   - Experiments via feature flags.

4. **Admin & Safety**
   - Admin dashboard: report handling, ban controls, content moderation queues.
   - Enhanced abuse prevention (heuristics & thresholds).

5. **Payments (optional)**
   - Stripe intents, deposits, cancellation fees aligned with cutoff rules.

6. **Data Lifecycle**
   - GDPR basics: export/delete account, retention policies, backups/DR runbooks.

---

## 14) Definition of Done (MVP)

- All **core features** above implemented with documented API.
- **Privacy rules** enforced (profiles/cliques).
- **Bookings** respect availability, cutoffs, and rescheduling rules.
- **Reviews** gated by completion; one per booking.
- **Messaging** live with delete window, typing, unread counters.
- **Notifications** list + mark read/all; event triggers wired.
- **Media** upload pipeline functioning (presign → PUT → register).
- **Search** returns users/occupations/cliques; private cliques limited exposure.
- **Mobile app** navigable (auth gate → feed → details) with **stable theming**.
- **Testing**: backend ≥ 85% coverage; E2E key flows pass locally on iOS; Android smoke green.
- **Performance & accessibility** baselines met.

---

## 15) Tech Stack

- **Mobile**
  - Expo (React Native), Expo Router v6
  - **@shopify/restyle** (theming), dayjs
  - Zustand (auth/theme stores), TanStack Query v5 (data)
  - Storage: **expo-secure-store** (primary), AsyncStorage (fallback)
  - Testing: Jest + Testing Library; **Maestro** E2E (local simulators/emulators)
  - Conventions: deep links `occupy://`, path alias `@/*`, kebab-case filenames

- **Backend**
  - FastAPI, SQLAlchemy
  - PostgreSQL, Redis, MinIO (S3-compatible)
  - Alembic migrations
  - Testing: pytest + Testcontainers; product verification harness
  - API: REST + WebSockets, JSON, camelCase externally
