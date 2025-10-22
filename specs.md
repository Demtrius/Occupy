# Project Spec — Social + Bookings Platform for Small Businesses

_Last updated: 2025-10-22_

---

## 1) Elevator Pitch

A mobile-first social network (Expo/React Native) where **business pages** (barbers, trainers, photographers, etc.) create **cliques** (their community hubs) to post updates, list services, publish availability, accept bookings, chat 1:1 with clients, and collect reviews. **Users** follow businesses, like/comment posts, book services in available time slots, and chat with owners.

---

## 2) Roles & Entities

- **User**
  - Flags: `is_business_page`, `is_private_account`, `is_admin`, `is_active`
  - Profile: username (unique, case-insensitive), email, full name, bio, profile image, occupations

- **Follow**: user ↔ user (statuses: `pending` for private target, `accepted`, `blocked`)
- **Clique**: owned by a business user; has privacy (`public`/`private`), name, description, image, timezone, occupations, cancellation cutoff hours
- **Post**: belongs to clique, authored by the owner; markdown content, status (`draft`/`posted`/`archived`), 0..n images
- **Comment**: 1-level replies (parent optional, only one depth); soft deletable
- **Like**: post likes (idempotent)
- **Service**: offering within a clique (title, desc, price_minor nullable, currency `EUR`, duration, buffer, is_active)
- **Availability**: global schedule windows for a clique
  - One-off: date + start/end time
  - Recurring weekly: day_of_week + start/end time (+ validity range)

- **Slot**: computed (not stored) from availability + service duration/buffer
- **Booking**: user books service at slot; statuses: `pending`/`confirmed`/`completed`/`cancelled`; cancellation reason & `cancelled_by`
- **Review**: one per completed booking (rating 1..5, optional comment)
- **Notification**: in-app events (like, comment, follow, booking request/confirmed/cancelled, review, message, system)
- **Chat**: explicit 1:1 business ↔ client
- **Message**: text or single image; hard-delete by sender within 15 minutes
- **Media**: files in MinIO (image/jpeg, png, webp) via presigned uploads

---

## 3) Core User Stories (MVP ✅)

### 3.1 Account & Auth

- As a user, I can register with email, username, password.
- As a user, I can log in, refresh tokens, and log out.
- As an admin, I can access admin-only endpoints (future).

### 3.2 Profiles, Follows, Privacy

- As a private user, follow requests to me must be approved before followers can see my content.
- As any user, I can block another user (mutual invisibility of content).
- As a user, I can edit my profile, set private/public, pick occupations.

### 3.3 Cliques (Business Hubs)

- As a **business** user, I can create/edit/delete a clique.
- As an outsider, I can always see a **private clique’s** _name_ and _description_ (metadata), but not content/members.
- As a user, I can join public cliques instantly or request to join private cliques and be approved/denied/banned by the owner.

### 3.4 Posts, Likes, Comments

- As a clique owner, I can create posts (draft → posted → archived), attach images, and edit/archive them.
- As a member/outsider (according to privacy), I can like/unlike posts (idempotent).
- As a member, I can comment on posts and reply one level deep; the owner can delete any comment in their clique (soft delete).

### 3.5 Services & Availability

- As a clique owner, I can define services with duration/buffer and set availability (one-off & recurring).
- As a user, I can view available **slots** generated from availability + service duration/buffer (non-overlapping, capacity=1).

### 3.6 Bookings

- As a user, I can book a service for a slot (with optional note); creation is idempotent with `Idempotency-Key`.
- As an owner, I can confirm/complete/cancel bookings (cancellation requires reason, and cutoff enforced).
- As a user, I can cancel before the cutoff.
- As a user/owner, I can reschedule a booking (same row updated, overlap rules enforced).

### 3.7 Reviews

- As a user, I can submit exactly one review for my **completed** booking.
- As anyone, I can view a clique’s reviews and its average rating.

### 3.8 Messaging

- As a client, I can start a chat with a business (explicit creation).
- As participants, we can exchange messages and see real-time updates via WebSockets.
- As a sender, I can delete my message within 15 minutes (hard delete).

### 3.9 Notifications

- As a user, I receive in-app notifications for: like, comment, follow, booking request/confirmed/cancelled, review, message, system.
- I can list notifications and mark read or mark all read.

### 3.10 Search

- As a user, I can search users, occupations, cliques (private cliques appear with only name/description).

---

## 4) Non-Functional Requirements (MVP)

- **API**: FastAPI, async SQLAlchemy 2.0, PostgreSQL, Redis, MinIO
- **Auth**: JWT (access/refresh); `Authorization: Bearer <token>`
- **Pagination**: Cursor-based (`items`, `nextCursor`)
- **Error shape**:

  ```json
  { "error": { "code": "string", "message": "string", "details": {} } }
  ```

- **Rate limiting**: enabled for auth + write routes (configurable)
- **Time**: all timestamps in UTC; cliques store a timezone for availability logic
- **Validation**: rich DTO validation (Pydantic v2)
- **Security**: block lists, private accounts, permission checks
- **Uploads**: presigned PUT to MinIO; backend only registers metadata
- **Testing**: ≥85% coverage, Testcontainers for Postgres/Redis/MinIO, WS tests
- **Performance**: end-to-end test suite < ~6 minutes in CI

---

## 5) Permissions Matrix (high level)

| Action                          | Visitor |                          Auth’d User | Follower (public target) | Follower (private target, approved) | Clique Member | Clique Owner |    Admin |
| ------------------------------- | ------: | -----------------------------------: | -----------------------: | ----------------------------------: | ------------: | -----------: | -------: |
| View user profile (public)      |       ✓ |                                    ✓ |                        ✓ |                                   ✓ |             ✓ |            ✓ |        ✓ |
| View user profile (private)     |       ✗ |                                    ✗ |                        ✗ |                                   ✓ |             ✓ |            ✓ |        ✓ |
| Follow user (public)            |       — |                      ✓ (auto-accept) |                        — |                                   — |             — |            — |        — |
| Follow user (private)           |       — |                          ✓ (pending) |                        — |                                   — |             — |            — |        — |
| Block user                      |       — |                             ✓ (self) |                        — |                                   — |             — |            — |        ✓ |
| View private clique metadata    |       ✓ |                                    ✓ |                        ✓ |                                   ✓ |             ✓ |            ✓ |        ✓ |
| View private clique content     |       ✗ |                                    ✗ |                        ✗ |                       ✓ (if member) |             ✓ |            ✓ |        ✓ |
| Create posts in clique          |       ✗ |                                    ✗ |                        ✗ |                                   ✗ |             ✗ |            ✓ |        ✓ |
| Like/comment post               |       ✗ | ✓ (if allowed by privacy/membership) |                        ✓ |                                   ✓ |             ✓ |            ✓ |        ✓ |
| Manage services/availability    |       ✗ |                                    ✗ |                        ✗ |                                   ✗ |             ✗ |            ✓ |        ✓ |
| Book service                    |       ✗ |                                    ✓ |                        ✓ |                                   ✓ |             ✓ |            — |        ✓ |
| Confirm/Cancel/Complete booking |       ✗ |                                    ✗ |                        ✗ |                                   ✗ |             ✗ |            ✓ |        ✓ |
| Review booking                  |       ✗ |                          booker only |                        — |                                   — |             — |            — | ✓ (list) |
| Create chat                     |       ✗ |            ✓ (with business account) |                        ✓ |                                   ✓ |             ✓ |            ✓ |        ✓ |

---

## 6) API Contracts (summary)

- **Auth**: `/api/v1/auth/login|refresh|logout|register`
- **Users**: `/users/{id}`, `/me`, `/users?q=`, followers/following CRUD, block/unblock
- **Occupations**: `/occupations`, `/occupations/user`, `/occupations/clique/{id}`
- **Cliques**: CRUD; `/cliques/{id}/members` + `join/approve/reject/ban/leave`; invites; `/feed`
- **Posts**: create/update/delete; list per clique; likes; comments (1-level); media attach
- **Media**: `/media/uploads/presign`, `/media`
- **Services**: `/services` under a clique; list/filter
- **Availability**: create/list/delete; **partial updates**
- **Slots**: `/cliques/{id}/slots?serviceId&from&to`
- **Bookings**: create (idempotent), confirm, complete, cancel, reschedule, show/list (mine, by clique)
- **Reviews**: create via booking; list by clique (with average)
- **Notifications**: list, mark read, mark all read
- **Search**: `q`, `types=users,occupations,cliques`
- **Messaging**: chats CRUD; messages CRUD (delete window)
- **WebSockets**: `/ws/chat` (join, message.send, message.created, message.deleted, typing)

All list endpoints: **cursor pagination**.

All errors: standardized **error envelope**.

---

## 7) Scheduling & Slot Rules

- **Slot generation**:
  - For each availability window and the selected service:
    - slot length = `service.duration_minutes + service.buffer_minutes`
    - generate non-overlapping slots inside window

  - Exclude slots overlapping existing **pending/confirmed** bookings
  - Capacity = 1

- **Availability variants**:
  - One-off: `date` + `start_time`–`end_time` (timezone of clique)
  - Recurring weekly: `day_of_week` + `start_time`–`end_time`, optional `valid_from`–`valid_until`

- **Cancellation cutoff**:
  - `clique.cancellation_cutoff_hours` default 24h
  - Client cannot cancel inside cutoff; owner can cancel anytime (must provide reason)

---

## 8) Messaging & WS Rules

- **Chat creation**: explicit; unique pair (business, client)
- **Messages**: text or one image; created/received in real time via `/ws/chat`
- **Delete window**: sender can hard-delete within 15 minutes; after that → 403
- **Events (WS)**:
  - Client → Server: `join`, `message.send`, `typing`
  - Server → Client: `message.created`, `message.deleted`, `typing`

---

## 9) Notifications

Trigger on:

- `like`, `comment`, `follow (pending/accepted)`, `booking_request`, `booking_confirmed`, `booking_cancelled`, `review`, `message`, `system`

Behavior:

- In-app store with JSON payload for deeplinks
- List unread/all, mark one read, mark all read

---

## 10) Validation Rules & Error Cases

- Username: unique (case-insensitive), length 3–32, URL-safe
- Email: unique (case-insensitive), valid format
- Posts: status transitions allowed: `draft↔posted↔archived` (no likes/comments on soft-deleted posts)
- Comments: parent must exist and be top-level; body required; soft delete masks body
- Media: MIME ∈ {jpeg, png, webp}; `size_bytes <= 10MB`
- Services: `duration_minutes > 0`; `buffer_minutes ≥ 0`; `currency == "EUR"`
- Availability:
  - If `is_recurring=true` → `date = NULL`, `day_of_week != NULL`
  - If `is_recurring=false` → `date != NULL`, `day_of_week = NULL`
  - `end_time > start_time`
  - **Partial updates** supported (patch semantics)

- Booking:
  - `start_ts` within a valid slot; `end_ts` derived
  - Overlap prevented (DB exclusion + service checks)
  - Create supports `Idempotency-Key`
  - Cancel inside cutoff → 400 validation error

- Review:
  - Only booker
  - Only after `completed`
  - One per booking (graceful validation error, not raw DB error)

- Search:
  - Private cliques appear with limited fields `{id,name,description}` only

- Auth:
  - Missing/invalid token → **401** + `WWW-Authenticate: Bearer`
  - Authenticated but unauthorized → **403**

---

## 11) Admin & Moderation (Post-MVP)

- Admin tools to view/disable accounts/cliques/posts/comments
- Content reports and resolution actions
- Rate-limit dashboards
- Audit logs

---

## 12) Observability & Ops (Post-MVP suggestions)

- Structured logging (request id, user id)
- Error tracking (Sentry)
- Metrics: bookings conversion, DAU/MAU, message counts, post engagement
- Background jobs (notifications fanout, cleanup tasks)
- Backups: DB, MinIO

---

## 13) Roadmap

### MVP (current)

- All features listed in sections 3–10 with minimal polish
- WS chat and notifications
- ≥85% test coverage

### Phase 2

- Payment integrations (hold, charge, refund flows)
- Multi-asset posts/messages
- Group chat (optional)
- Rich moderation tools
- Full-text search / ranking
- Internationalization

### Phase 3

- Recommendations (people/cliques/services)
- Calendaring integrations (iCal export)
- Analytics for business owners

---

## 14) Acceptance Checklist (Go/No-Go)

- [ ] Auth: register/login/refresh/logout; 401 vs 403 correctly
- [ ] Privacy: private profiles gated; blocks enforced
- [ ] Cliques: business-only create; private metadata visible; membership flows
- [ ] Posts: CRUD, media, likes/comments (1-level), soft delete, counts present
- [ ] Services: CRUD; Availability: one-off/recurring; **partial update**
- [ ] Slots: computed, non-overlapping, capacity=1, excludes pending/confirmed
- [ ] Bookings: idempotent create; lifecycle; cutoff; reschedule; visibility
- [ ] Reviews: 1 per completed booking; list + average rating
- [ ] Notifications: all events stored and can be marked read/all
- [ ] Search: users/occupations/cliques; private cliques limited
- [ ] Messaging: explicit chat; messages WS; delete window enforced
- [ ] Media: presign + register; MIME/size validated
- [ ] Error envelope everywhere; cursor pagination everywhere
- [ ] Tests: all pass; coverage ≥ 85%

---

## 15) Glossary

- **Clique**: A business’s community hub (page + community + scheduling).
- **Slot**: A computed time interval available to book, derived from availability + service duration/buffer.
- **Cutoff**: Minimum time before `start_ts` after which client cancellations are forbidden.

---

> **Note:** This spec captures the **current** agreed MVP behavior plus near-term suggestions. When changes are made in implementation (e.g., adding payments or group chat), update this document to keep engineering, QA, and product aligned.
