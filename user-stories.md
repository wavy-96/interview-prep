# User Stories — AI Interview Prep Platform (Shippable MVP)

> Stories are sized at **2 points by default** for planning.
> Any story that grows beyond 2 points must be split before implementation.
> Stories are grouped into **Epics** and ordered by dependency.
> Each story has explicit **success criteria** that must pass before it is marked done.
> Each story includes **⚠️ Risks & Common Mistakes** to watch out for during implementation.
> Completing ALL stories produces a **shippable product**, not just a prototype.

---

## Pre-Requisites: API Keys & Accounts

> **Before each epic begins, the user must provide or confirm only the keys needed for that epic.**
> Keys for later epics can be provided later; connectivity must be validated at each epic boundary.

| # | Key / Account | Needed By Epic | How To Get It |
|---|--------------|----------------|---------------|
| 1 | **Supabase** project URL + `anon` key + `service_role` key | Epic 1 | Create project at supabase.com |
| 2 | **Supabase** OAuth credentials (Google client ID/secret, GitHub client ID/secret) | Epic 1 | Google Cloud Console + GitHub Developer Settings |
| 3 | **OpenAI** API key (with Realtime API access) | Epic 4 | platform.openai.com → API Keys |
| 4 | **Anthropic** API key | Epic 5 | console.anthropic.com → API Keys |
| 5 | **Modal** account + token | Epic 6 | modal.com → Settings → API Tokens |
| 6 | **Stripe** publishable key + secret key + webhook signing secret | Epic 7 | dashboard.stripe.com → Developers → API Keys |
| 7 | **Fly.io** account + auth token | Epic 3 | fly.io → `flyctl auth token` |
| 8 | **Google Cloud** Gemini API key (for free-tier voice) | Epic 4 | ai.google.dev → API Keys |
| 9 | **Vercel** account (linked to GitHub repo) | Epic 1 | vercel.com |
| 10 | **Sentry** DSN (free tier) | Epic 11 | sentry.io → Create Project |

**Prompt script** (run at start of each epic):
```
Before we begin Epic [N], I need the keys required for this epic configured as environment variables.
Only provide keys needed for this epic; leave non-epic keys blank for now:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
FLY_API_TOKEN=
GOOGLE_GEMINI_API_KEY=
INTERNAL_WEBHOOK_SECRET=        # generate: openssl rand -hex 32
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

Please provide or confirm the keys required for this epic, and I will validate connectivity before proceeding.
```

---

## Documentation Update Plan

After **every completed story**, the implementor must:

1. **Update `technical-architecture.md`** — mark the relevant section as "Implemented" with the commit SHA.
2. **Update `user-stories.md`** — mark the story status/progress in this artifact with a one-line completion note.
3. **Add inline code comments** — only where behavior is non-obvious.
4. **Update README.md** (created in Story 1.1) — add setup steps, env vars, and run instructions as features land.

After **every completed epic**:
1. Run all existing tests to confirm no regressions.
2. Add a `## Epic N — [Name] ✅` section to the bottom of `technical-architecture.md` confirming what was built vs. what was designed.

---

## Epic 1: Project Foundation & Auth

> **Keys needed:** Supabase URL, anon key, service role key, Google/GitHub OAuth creds
> **Prompt user for keys before starting this epic.**

### Story 1.0 — Design System Setup ✅
**As a** developer,
**I want** the design system configured (fonts, colors, Shadcn/UI, Aceternity),
**so that** all subsequent UI work is consistent from the first component.

**Completion:** next/font (Inter, Lora, Newsreader, JetBrains Mono), @theme colors + type scale, Shadcn canary (button, input, card, dropdown-menu, dialog, badge, sonner), Aceternity Bento Grid + Sparkles, framer-motion, lucide-react. `/design` test page gated behind NODE_ENV=development.

**Success Criteria:**
- [x] Google Fonts import added to `globals.css` (Inter, Lora, Newsreader, JetBrains Mono) — via next/font
- [x] `tailwind.config.ts` extended with full color palette from `design-style-guide.md` (paper, ink, clay, forest, status colors) — via @theme in globals.css (Tailwind v4)
- [x] Font families configured: `font-serif` (Lora), `font-sans` (Inter), `font-mono` (JetBrains Mono)
- [x] Type scale tokens applied as Tailwind `fontSize` extensions per style guide
- [x] `shadcn/ui` initialized via `npx shadcn@latest init` — base components installed: `button`, `input`, `card`, `dropdown-menu`, `sonner` (toast), `dialog`, `badge`
- [x] `aceternity-ui` installed; Sparkles and Bento Grid components available for import
- [x] `framer-motion` and `lucide-react` installed
- [x] A test page at `/design` renders: heading (Lora), body (Inter), code block (JetBrains Mono), a Shadcn button, a toast, and the color palette — verifying everything loads correctly
- [x] Test page removed before merge (or gated behind `NODE_ENV=development`)

**⚠️ Risks & Common Mistakes:**
- **Google Fonts @import in CSS blocks rendering** — use `<link>` in `<head>` via `next/font` or layout.tsx for non-blocking load; `@import` in CSS is a render-blocking anti-pattern
- Shadcn init choosing wrong Tailwind config path — verify it updates the correct `tailwind.config.ts`, not a stale file
- Aceternity components importing their own Tailwind classes that conflict with your custom palette — test for class collisions early
- Not wrapping fonts in `next/font/google` — Next.js can self-host Google Fonts for zero layout shift; raw `<link>` tags cause FOUT (Flash of Unstyled Text)

---

### Story 1.1 — Scaffold Next.js Project ✅
**As a** developer,
**I want** a Next.js App Router project with TypeScript, Tailwind, and ESLint configured,
**so that** I have a working dev environment to build on.

**Completion:** Next.js 16 + App Router + TypeScript + Tailwind v4 + ESLint. Path alias `@/` → `src/`. README, .env.local.example, .gitignore in place.

**Success Criteria:**
- [x] `npx create-next-app` with App Router, TypeScript, Tailwind, ESLint
- [x] `npm run dev` serves a page at `localhost:3000` without errors
- [x] `README.md` exists with project name, description, and `npm run dev` instructions
- [x] `.env.local.example` lists all env vars from the pre-requisites table above
- [x] `.gitignore` includes `.env.local`, `node_modules`, `.next`
- [x] Path aliases configured (`@/` → `src/`)

**⚠️ Risks & Common Mistakes:**
- Using **Pages Router** instead of App Router — always verify `app/` directory structure, not `pages/`
- Forgetting to add `.env.local` to `.gitignore` — secrets committed on first push
- Not setting up `@/` path aliases — leads to fragile relative imports (`../../../`) later
- Choosing wrong Tailwind version — ensure Tailwind v4 compatibility with Next.js version

### Story 1.2 — Supabase Auth Integration ✅
**As a** user,
**I want** to sign up and log in with email/password, Google, or GitHub,
**so that** I have a secure account on the platform.

**Completion:** Supabase client + server utils (@supabase/ssr), login/signup pages with email/password + Google/GitHub OAuth, auth callback route, middleware protecting /dashboard, logout server action, home redirect for authenticated users.

**Success Criteria:**
- [x] Supabase client initialized with env vars (`@supabase/ssr`)
- [x] Sign-up page at `/signup` with email/password + Google + GitHub OAuth buttons
- [x] Login page at `/login` with same providers
- [x] Auth callback route at `/auth/callback` handles OAuth redirects
- [x] Middleware protects `/dashboard/*` routes — unauthenticated users redirect to `/login`
- [x] Supabase `auth.users` table populated on successful sign-up
- [x] Logout button clears session and redirects to `/`

**⚠️ Risks & Common Mistakes:**
- **OAuth redirect URL mismatch** — must configure exact callback URLs in Supabase dashboard AND Google/GitHub consoles; even a trailing slash difference breaks it
- Using `@supabase/auth-helpers-nextjs` (deprecated) instead of `@supabase/ssr` — the old package has known cookie bugs in App Router
- **Cookie handling** — `@supabase/ssr` requires manual cookie get/set/remove in middleware; missing any one causes silent auth failures
- Auth callback race condition — if `exchangeCodeForSession` fails, user gets stuck on blank page; always redirect to `/login?error=...`
- Forgetting to enable Email/Google/GitHub providers in Supabase → Auth → Providers settings

---

### Story 1.3— User Profiles & Database Schema ✅
**As a** user,
**I want** a profile created automatically when I sign up,
**so that** I can track my preferences and credits.

**Completion:** Migration in `supabase/migrations/` creates profiles table, handle_new_user trigger (SECURITY DEFINER, ON CONFLICT DO NOTHING), RLS, column-update guard. GET/PATCH /api/users/profile. Dashboard shows credits.

**Success Criteria:**
- [x] Supabase migration creates `profiles` table per schema in `technical-architecture.md`
- [x] Database trigger auto-creates a profile row when a new `auth.users` row is inserted
- [x] Profile defaults: `credits = 3`, `subscription_tier = 'free'`
- [x] RLS policy: users can only read/update their own profile
- [x] `GET /api/users/profile` returns the authenticated user's profile
- [x] `PATCH /api/users/profile` updates name, experience level, target companies

**⚠️ Risks & Common Mistakes:**
- **Trigger permissions** — the `handle_new_user` trigger function MUST use `SECURITY DEFINER` or it runs as the anonymous user and gets blocked by RLS
- **Race condition on OAuth** — Google sign-in can fire multiple `auth.users` inserts if user clicks rapidly; trigger must use `INSERT ... ON CONFLICT DO NOTHING`
- RLS policy allowing `UPDATE` on the `credits` column — users could give themselves unlimited credits; restrict updatable columns to `name, experience_level, target_companies` only
- Not indexing `profiles.user_id` — every authenticated request queries this

---

### Story 1.4a — Problems Schema, API & RLS ✅
**As a** developer,
**I want** the problems tables and API endpoints created with proper RLS,
**so that** the content layer is ready to receive seed data.

**Completion:** Migration creates problems, test_cases, problem_solutions. RLS: public problems, example-only test cases, service-role solutions. GET /api/problems (paginated, difficulty/category), GET /api/problems/[slug], GET /api/problems/random. 3 seeded problems. Dashboard + /problems/[slug] pages.

**Success Criteria:**
- [x] Migration creates `problems`, `test_cases`, `problem_solutions` tables per schema
- [x] RLS: problems are public-readable; test cases only expose `is_example = TRUE AND is_hidden = FALSE`; solutions are service-role-only
- [x] `GET /api/problems` returns paginated list with difficulty/category filters
- [x] `GET /api/problems/[slug]` returns problem details + example test cases only (no hidden cases, no solutions)
- [x] `GET /api/problems/random?difficulty=easy` returns a random problem matching filters
- [x] RLS leakage test: a user JWT cannot access `problem_solutions` or hidden `test_cases`
- [x] At least 3 manually inserted test problems verify API works end-to-end

**⚠️ Risks & Common Mistakes:**
- **RLS misconfiguration is the #1 risk here** — a single `SELECT` policy on `test_cases` without filtering `is_hidden` exposes all hidden test cases; test with an actual user JWT, not the service role key
- `problem_solutions` table must have NO user-facing RLS policy at all (service-role-only)
- Random problem endpoint using `ORDER BY RANDOM()` in Postgres is O(n) — use `TABLESAMPLE` or pre-computed random IDs

---

### Story 1.4b — Seed 50 Problems with Test Cases & Starter Code ✅
**As an** admin,
**I want** 50 curated problems seeded into the database,
**so that** users have meaningful content to practice with at launch.

**Completion:** Seed script `scripts/seed-problems.ts` with 50 problems. Run `npm run db:seed`. Requires `SUPABASE_SERVICE_ROLE_KEY`. Data in `scripts/data/problems.ts`.

**Success Criteria:**
- [x] Seed script inserts **50 problems** (25 easy + 25 medium) across ≥5 categories (arrays, strings, hash maps, trees, dynamic programming)
- [x] Each problem has: description, constraints, ≥2 example test cases (visible) + ≥3 hidden test cases
- [x] Starter code templates for Python, JavaScript, and Java — each compiles/runs without error
- [x] Solutions provided for all 50 problems (service-role-only table)
- [x] Seed script gated behind `NODE_ENV=development` or run as a manual migration
- [x] `GET /api/problems` returns all 50 problems; filters by difficulty and category work correctly

**⚠️ Risks & Common Mistakes:**
- **Starter code templates must actually compile/run** — common mistake: syntax errors in Java boilerplate; test each template against its hidden test cases
- Seed script accidentally running in production — gate it behind `NODE_ENV=development` or a manual migration
- Test case edge cases missing — problems without edge case coverage produce false positives when users submit
- Copy-paste errors between languages — same logic with wrong language syntax; automate validation if possible

---

### Story 1.5 — Landing Page *(NEW — required for shippable MVP)* ✅
**As a** visitor,
**I want** an attractive landing page explaining the product,
**so that** I understand what the platform does and can sign up.

**Completion:** Hero (headline, subheadline, "Start Practicing Free" CTA), features (voice AI, code observation, evaluation), pricing (free/pro/enterprise from config), footer (Terms, Privacy, GitHub). SEO meta, auth redirect, mobile-responsive.

**Success Criteria:**
- [x] `/` route shows the landing page (unauthenticated users)
- [x] Authenticated users visiting `/` are redirected to `/dashboard`
- [x] Hero section: headline, subheadline, primary CTA ("Start Practicing Free")
- [x] Feature highlights: voice AI interviewer, real-time code observation, post-interview evaluation
- [x] Pricing section: free tier (3 credits) vs. paid options
- [x] Footer: links to Terms, Privacy Policy, GitHub
- [ ] Page scores ≥90 on Lighthouse Performance
- [x] SEO meta tags: title, description, Open Graph image
- [x] Mobile-responsive (works down to 375px width)

**⚠️ Risks & Common Mistakes:**
- **CTA not wired to auth** — the "Sign Up" button must actually navigate to `/signup`, not a dead link
- Heavy hero images tanking Core Web Vitals — use Next.js `<Image>` with priority loading, WebP/AVIF format
- Missing Open Graph image — social shares look broken without it
- Not testing on mobile — landing pages often break at small widths even if the app is desktop-only
- Pricing section showing stale prices — pull from a config constant, not hardcoded strings

---

## Epic 2: Interview Session Foundation

> **Keys needed:** Same as Epic 1 (Supabase).

### Story 2.1 — Session & Related Tables ✅
**As a** developer,
**I want** the remaining database tables created,
**so that** interview sessions, transcripts, snapshots, and evaluations can be stored.

**Success Criteria:**
- [x] Migration creates `sessions`, `transcripts`, `code_snapshots`, `evaluations`, `credit_transactions`, `payments`, `subscriptions` tables per schema
- [x] All RLS policies from `technical-architecture.md` are applied
- [x] Service-role policies exist for all tables (backend writes)
- [x] `updated_at` triggers fire on `profiles`, `sessions`
- [x] Credit update trigger fires on `credit_transactions` insert

**⚠️ Risks & Common Mistakes:**
- **Foreign key cascade misconfiguration** — if a user deletes their account, cascade must properly clean up sessions → transcripts → snapshots → evaluations; test this path
- Missing indexes on `sessions.user_id` and `sessions.status` — queried on every dashboard load
- Credit trigger using `AFTER INSERT` when it should use row-level locking — concurrent credit additions can produce wrong balance
- Not testing that service-role policies actually allow backend writes

---

### Story 2.2— Session Lifecycle API ✅
**As a** user,
**I want** to start, view, and end an interview session,
**so that** each practice interview is tracked from start to finish.

**Success Criteria:**
- [x] `POST /api/sessions/start` — creates session, deducts 1 credit, returns `{ sessionId, problem, wsToken }`; rejects if credits = 0
- [x] `GET /api/sessions/[sessionId]` — returns session details; 403 if not the owner
- [x] `POST /api/sessions/[sessionId]/end` — marks session completed, stores `ended_at` and `duration_seconds`
- [x] `GET /api/sessions` — lists the authenticated user's sessions (paginated, newest first)
- [x] Credit deduction is atomic (no double-spend on concurrent requests)
- [x] Session status transitions: `scheduled → active → completed|abandoned`

**⚠️ Risks & Common Mistakes:**
- **Double-spend race condition** — if user clicks "Start" twice quickly, two sessions may be created with only 1 credit; use `SELECT ... FOR UPDATE` or a Postgres advisory lock
- Not wrapping credit check + deduct + session create in a single database transaction
- Session state machine allowing invalid transitions (e.g., `completed → active`)
- Returning `wsToken` in the response body without appropriate cache headers — tokens could be cached by CDN/browser
- `GET /api/sessions` without pagination limit — user with 500 sessions loads them all

---

### Story 2.3— Code Snapshot API ✅
**As a** user,
**I want** my code saved periodically during an interview,
**so that** my progress is preserved and reviewable.

**Success Criteria:**
- [x] `POST /api/sessions/[sessionId]/code` — saves a code snapshot with `{ code, language, timestamp_ms }`
- [x] Validates session is `active` and owned by the authenticated user
- [x] Snapshot types: `auto` (periodic), `manual` (user-triggered), `execution` (before run), `final` (on session end)
- [x] Max code size enforced: 50KB per snapshot
- [x] `GET /api/sessions/[sessionId]` includes the latest code snapshot

**⚠️ Risks & Common Mistakes:**
- **No rate limiting on snapshot saves** — client could send a snapshot on every keystroke; enforce max 1 `auto` snapshot per 10 seconds server-side
- 50KB limit enforced only client-side — server must also validate; client-side checks are trivially bypassed
- `final` snapshot not saved if user closes browser tab — use `beforeunload` event + `navigator.sendBeacon()` as a last resort
- Missing index on `(session_id, created_at)` — evaluator queries all snapshots for a session ordered by time

---

### Story 2.4— Interview Dashboard Page ✅
**As a** user,
**I want** a dashboard showing my past interviews and credits,
**so that** I can see my history and remaining balance.

**Success Criteria:**
- [x] `/dashboard` page shows: credit balance, total sessions, list of past sessions
- [x] Each session card shows: problem title, difficulty, date, duration, score (if evaluated)
- [x] "Start Interview" button navigates to problem selection
- [x] Problem selection page: pick difficulty → optional category filter → see random problem → confirm → session starts
- [x] Dashboard + problem selection are responsive (work at 375px mobile width)
- [x] Live interview route remains desktop-focused and uses the interview desktop gate (<1024px)

**⚠️ Risks & Common Mistakes:**
- **N+1 query problem** — loading sessions, then evaluation for each, then problem for each = 3N+1 queries; use a single query with JOINs
- Not handling the "no sessions yet" empty state — blank page confuses first-time users; show an encouraging CTA
- Score showing as `null` when evaluation is still processing — show "Evaluating…" badge instead
- Problem selection showing the same problem the user just completed — filter out recently-completed problem IDs

---

## Epic 3: Fly.io Real-Time Server

> **Keys needed:** Fly.io auth token, Supabase service role key, `INTERNAL_WEBHOOK_SECRET`
> **Prompt user for keys before starting this epic.**

### Story 3.1 — Fly.io WebSocket Server Scaffold
**As a** developer,
**I want** a standalone Node.js WebSocket server deployable to Fly.io,
**so that** we can maintain persistent connections beyond Vercel's 300s limit.

**Success Criteria:**
- [ ] Separate directory/repo: `realtime-server/` with `package.json`, TypeScript, `ws` library
- [ ] Server listens on port 8080, accepts WebSocket connections
- [ ] `fly.toml` configured with primary region `iad`, health check on `/health`
- [ ] `GET /health` returns `200 OK` with uptime and connection count
- [ ] Dockerfile builds and runs the server
- [ ] `flyctl deploy` succeeds and server is reachable at `wss://<app>.fly.dev`

**⚠️ Risks & Common Mistakes:**
- **Fly.io auto-stop** — by default, Fly scales machines to 0 when idle; first user gets 5-10s cold start; set `min_machines_running = 1` in `fly.toml`
- Internal port mismatch — Fly expects app on port 8080 internally but proxies from 443 externally
- Health check path wrong — Fly will restart the machine if `/health` returns non-200
- Not adding `.dockerignore` — Docker copies `node_modules` and build artifacts, ballooning image size
- Forgetting to set environment variables on Fly (`flyctl secrets set`)

---

### Story 3.2— WebSocket Auth & Session Binding
**As a** user,
**I want** my WebSocket connection authenticated and bound to my session,
**so that** only I can interact with my interview.

**Success Criteria:**
- [ ] `POST /api/realtime/token` on Vercel generates a one-time JWT (TTL ≤ 60s) with `{ userId, sessionId, jti }`
- [ ] Client sends token via `Sec-WebSocket-Protocol` header (not query params)
- [ ] Fly.io server verifies JWT signature using Supabase public key
- [ ] `jti` nonce stored in Redis with 2-hour TTL; reused tokens are rejected
- [ ] Session ownership verified against Supabase `sessions` table
- [ ] Invalid/expired/replayed tokens result in `close(4001, 'Unauthorized')`

**⚠️ Risks & Common Mistakes:**
- **Token in query params** is the #1 mistake — query strings appear in server access logs, CDN logs, Referrer headers, and browser history; always use `Sec-WebSocket-Protocol`
- Not validating JWT `iss` (issuer) and `aud` (audience) — any valid Supabase JWT from a different project could authenticate
- Redis JTI store not configured with TTL — nonces accumulate forever, exhausting Redis memory
- Supabase public key rotation — hardcoding the key means auth breaks silently; fetch dynamically or cache with a TTL

---

### Story 3.3— Event Allowlist & Message Validation
**As a** developer,
**I want** the WS server to reject invalid client messages,
**so that** no arbitrary events can be forwarded to the AI provider.

**Success Criteria:**
- [ ] Only allowed event types are forwarded: `input_audio_buffer.append`, `input_audio_buffer.commit`, `response.cancel`, `session.ping`, `code_edit`
- [ ] Messages exceeding 64KB are rejected with `close(1009)`
- [ ] Messages that fail JSON schema validation return `{ type: 'error', code: 'invalid_payload' }`
- [ ] `code_edit` events are intercepted and routed to Code Observer (not forwarded to voice provider)
- [ ] Unit tests cover: valid event forwarded, invalid event rejected, oversized payload rejected, malformed JSON rejected

**⚠️ Risks & Common Mistakes:**
- **Audio frames are binary, not JSON** — `input_audio_buffer.append` sends binary WebSocket frames; if you `JSON.parse` everything, audio breaks; check frame type first
- Allowlist too strict — OpenAI may add new required event types in API updates; log rejected events so you can spot this quickly
- Not handling WebSocket `ping/pong` frames (protocol-level) — dropping these can cause Fly.io to think the connection is dead
- 64KB limit too small for some legitimate audio chunks — measure actual frame sizes in testing and adjust

---

### Story 3.4a — Redis Streams Setup & Event Publishing
**As a** developer,
**I want** Redis Streams configured for durable event publishing,
**so that** agent events are reliably written and persist across restarts.

**Success Criteria:**
- [ ] Redis connection established with Fly.io Redis add-on (ioredis client with TLS)
- [ ] Events published via `XADD` to `events` stream: `session.started`, `code.edited`, `code.executed`, `session.ended`
- [ ] `MAXLEN ~10000` applied on every `XADD` to prevent unbounded memory growth
- [ ] Consumer groups created on startup: `observer-workers`, `evaluator-workers` (with `XGROUP CREATE ... MKSTREAM`)
- [ ] Unit test: publish event → verify it appears in stream via `XRANGE`
- [ ] Graceful handling of `NOGROUP` error on first deploy

**⚠️ Risks & Common Mistakes:**
- **NOGROUP error on first `XREADGROUP`** — consumer group must be created with `XGROUP CREATE` before any reads; crashes app on first deploy
- **Memory leak** — without `MAXLEN`, the stream grows unbounded; add `MAXLEN ~10000` to `XADD` calls
- Upstash Redis `BLOCK` command may behave differently from self-hosted Redis — test with actual provider
- Redis connection not using TLS — Fly.io Redis requires TLS; plaintext connections are silently rejected

---

### Story 3.4b — Consumer Groups, Retries & Dead Letter Queue
**As a** developer,
**I want** workers that consume, acknowledge, and retry stream events,
**so that** failed events are retried and permanently failed events are quarantined.

**Success Criteria:**
- [ ] Workers read with `XREADGROUP` using `BLOCK 5000` (no busy-loop)
- [ ] Workers process events and `XACK` on success
- [ ] Unacknowledged events (pending >30s) are claimed via `XAUTOCLAIM` and retried up to 5 times
- [ ] Events failing 5 retries are moved to `events.dlq` stream with original payload + error reason
- [ ] Integration test: publish event → consume → ack → verify processed
- [ ] Integration test: simulate failure → verify retry count increments → verify DLQ after 5 failures
- [ ] DLQ events logged with a warning for operational visibility

**⚠️ Risks & Common Mistakes:**
- Not setting `BLOCK` timeout on `XREADGROUP` — without it, the worker busy-loops and burns CPU
- Not handling `XACK` failures — if worker processes event but crashes before ACK, it re-processes on restart (must be idempotent)
- DLQ events never reviewed — set up alerting when events hit the DLQ
- `XAUTOCLAIM` not available on older Redis versions — verify Redis version ≥6.2 on Fly.io

---

## Epic 4: Voice Interview Pipeline

> **Keys needed:** OpenAI API key (Realtime access), Google Gemini API key
> **Prompt user for keys before starting this epic.**

### Story 4.1a — OpenAI Realtime API Proxy (Core Audio)
**As a** user,
**I want** my voice streamed to the AI interviewer and its responses played back,
**so that** I can have a real-time voice conversation.

**Success Criteria:**
- [ ] Fly.io server opens a WebSocket to `wss://api.openai.com/v1/realtime` on session start using model `gpt-realtime`
- [ ] Client audio frames (`input_audio_buffer.append`) are proxied to OpenAI
- [ ] OpenAI audio responses are proxied back to client
- [ ] System prompt injected with problem context, candidate level, and interviewer personality (kept under 2000 tokens)
- [ ] Session configured with VAD (voice activity detection) enabled
- [ ] Audio format validated: 16-bit PCM at 24kHz mono
- [ ] Both WebSocket connections (client + OpenAI) cleaned up on disconnect (no memory leak)

**⚠️ Risks & Common Mistakes:**
- **Using deprecated model name** — `gpt-4o-realtime-preview` was deprecated; use `gpt-realtime` or `gpt-realtime-mini` (Feb 2026 naming)
- **System prompt too long** — Realtime API has a token limit for session config; keep under 2000 tokens
- Audio format mismatch — OpenAI expects 16-bit PCM at 24kHz mono; sending 48kHz or stereo produces garbled speech
- Memory leak — each session holds two WebSocket connections (client + OpenAI); not cleaning up on disconnect leaks memory

---

### Story 4.1b — Transcript Storage & Connection Resilience
**As a** developer,
**I want** voice transcripts stored durably and connections to handle errors,
**so that** we have conversation records and recover from transient failures.

**Success Criteria:**
- [ ] Transcript chunks (`conversation.item.created`) are batched and stored to Supabase `transcripts` table every 5 seconds
- [ ] Batch insert uses upsert to handle duplicates from retries
- [ ] Connection errors to OpenAI trigger up to 3 retries with exponential backoff (1s, 2s, 4s)
- [ ] If all retries fail, client receives `{ type: 'error', code: 'provider_unavailable' }` and session is marked `errored`
- [ ] OpenAI 429 (rate limit) responses handled gracefully: back off, notify client
- [ ] Unit test: verify transcript batching inserts correct records
- [ ] Unit test: simulate OpenAI disconnect → verify retry logic fires

**⚠️ Risks & Common Mistakes:**
- **Transcript storage flooding** — inserting per-event instead of batched overwhelms the database; batch every 5 seconds
- Not handling OpenAI rate limits — 429 responses must trigger backoff, not crash the connection
- Batch insert losing events — if the batch insert fails, events must be re-queued, not dropped
- Session left in `active` state after provider failure — must transition to `errored` so user isn't stuck

---

### Story 4.2— Voice Provider Abstraction
**As a** developer,
**I want** a provider abstraction layer for voice,
**so that** we can route free-tier users to Gemini and paid users to OpenAI.

**Completion:** VoiceProvider interface (send, injectTimeWarning, disconnect). OpenAIRealtimeProvider (existing openai-proxy). GeminiLiveProvider (Gemini 2.5 Flash native audio, 24→16kHz resampling). Factory routes by subscription_tier: free→Gemini (fallback OpenAI), pro/enterprise→OpenAI.

**Success Criteria:**
- [x] `VoiceProvider` interface: `send()`, `injectTimeWarning()`, `disconnect()`
- [x] `OpenAIRealtimeProvider` implements the interface
- [x] `GeminiLiveProvider` implements the interface (Gemini Live API via WebSocket)
- [x] Provider selected based on user's `subscription_tier` from session metadata
- [x] Both providers produce identical transcript event shapes for downstream consumption
- [ ] Integration test: connect → send 3s of silence → receive AI greeting → disconnect

**⚠️ Risks & Common Mistakes:**
- **Audio format differences** — OpenAI uses 24kHz 16-bit PCM; Gemini may use different sample rates; abstraction layer MUST handle resampling
- Abstraction leaking provider-specific details — if `onAudio()` returns different shapes per provider, all downstream code breaks
- Gemini Live API is newer and less stable — expect API changes; wrap in try/catch with fallback
- Provider selection at connection time means you can't switch mid-session — if OpenAI goes down, the session is stuck

---

### Story 4.3— Client Audio Capture & Playback
**As a** user,
**I want** my browser to capture my microphone and play AI audio,
**so that** the voice interview works end-to-end.

**Success Criteria:**
- [ ] Browser requests `getUserMedia({ audio: true })` with proper error handling
- [ ] Audio captured as 16-bit PCM, 24kHz, chunked into 100ms frames
- [ ] Frames sent as `input_audio_buffer.append` events over WS
- [ ] Incoming AI audio frames decoded and played via Web Audio API
- [ ] Client-side VAD prevents sending silence (reduces bandwidth + cost)
- [ ] Mute/unmute toggle works without dropping the WS connection
- [ ] Microphone permission denial shows a clear error message with retry button

**⚠️ Risks & Common Mistakes:**
- **HTTPS required** — `getUserMedia` is blocked on HTTP; development must use `localhost` (special-cased) or an HTTPS tunnel
- **Chrome autoplay policy** — `AudioContext` starts suspended; you MUST call `audioContext.resume()` inside a user gesture or playback silently fails
- Echo/feedback loop — if speakers play AI audio while mic is hot, AI hears itself; implement acoustic echo cancellation or auto-mute during AI speech
- Audio context not resuming after tab switch — handle `visibilitychange` event
- Memory leak in audio processing — `AudioWorklet` nodes not disconnected on session end accumulate
- Safari compatibility — Safari `getUserMedia` and `AudioWorklet` behave differently from Chrome; test specifically

---

### Story 4.4— Timer & Session Flow Control
**As a** user,
**I want** a countdown timer that ends my interview when time is up,
**so that** the interview simulates real time pressure.

**Success Criteria:**
- [ ] Timer is server-authoritative: Fly.io starts countdown on session activation
- [ ] Timer state stored in Redis; broadcast to client every 5 seconds
- [ ] Client displays countdown but cannot control it
- [ ] At 5-min and 1-min marks, the AI interviewer gives a verbal time warning
- [ ] On expiry, server emits `session.ended` event; client auto-navigates to summary
- [ ] If WS drops and reconnects, timer resumes from server state (no reset)
- [ ] "End Early" button sends `session.ended` event and stops the timer

**⚠️ Risks & Common Mistakes:**
- **Client-side timer drift** — `setInterval` is not precise and drifts on background tabs (Chrome throttles to 1/min); always re-sync from server time
- Timer not surviving WS reconnection — if stored only in WS connection object, it's lost; store in Redis keyed by session ID
- AI time warnings not triggering — if Realtime API session has been idle too long, injecting a message may fail
- "End Early" button not debounced — user can click multiple times; handle idempotently
- Timer shows negative values — if server broadcast is delayed, clamp to `00:00`

---

### Story 4.5 — Onboarding & Microphone Test *(NEW — required for shippable MVP)*
**As a** first-time user,
**I want** a guided onboarding with a microphone test,
**so that** I know my setup works before starting an interview.

**Completion:** Migration adds `onboarding_completed` to profiles. `/onboarding` flow: Welcome, Mic test (audio level meter), Speaker test (Web Speech API), Layout walkthrough. Skip on each step. Dashboard/start redirect if not completed.

**Success Criteria:**
- [x] First login triggers onboarding flow (tracked via `profiles.onboarding_completed` boolean)
- [x] Step 1: Welcome screen explaining how the platform works (3 bullet points + illustration)
- [x] Step 2: Microphone permission request + test — user speaks, sees audio level meter confirming mic works
- [x] Step 3: Speaker test — play a short AI greeting, user confirms they can hear it
- [x] Step 4: Quick walkthrough of the interview screen layout (annotated screenshot or overlay)
- [x] "Skip" button available on each step (experienced users can skip)
- [x] Onboarding state persisted — returning users go straight to dashboard
- [x] If mic test fails, show troubleshooting tips (check browser permissions, try different browser)

**⚠️ Risks & Common Mistakes:**
- **Mic test false negatives** — audio level threshold set too high means quiet mics fail; use a low threshold and show a visual meter so users can self-assess
- Not persisting onboarding completion — user refreshes the page and sees onboarding again
- Blocking returning users with onboarding — always provide a "Skip" option; check `onboarding_completed` on login
- Speaker test not working due to autoplay policy — same Chrome issue as Story 4.3; require a click before playing audio
- Onboarding flow not responsive — this is likely the first screen mobile users see; make it work on mobile even if interview is desktop-only

---

## Epic 5: Code Editor & AI Observer

> **Keys needed:** Anthropic API key, `INTERNAL_WEBHOOK_SECRET`
> **Prompt user for keys before starting this epic.**

### Story 5.1 — Monaco Editor Integration
**As a** user,
**I want** a VS Code-style code editor in the interview screen,
**so that** I can write code comfortably.

**Completion:** @monaco-editor/react with next/dynamic ssr:false. Syntax highlighting (Python, JS, Java), dark theme, line numbers, bracket matching, auto-indent. Resizable split pane (problem left, editor right). Run Code button placeholder.

**Success Criteria:**
- [x] Monaco Editor rendered in the interview page with syntax highlighting for Python, JavaScript, Java
- [x] Language selector switches Monaco language mode and loads starter code template (session language)
- [x] Editor supports: line numbers, bracket matching, auto-indent, undo/redo
- [x] Dark theme by default
- [ ] Editor state (code + cursor position) preserved across WS reconnections (Story 5.2)
- [x] Editor pane is resizable relative to the problem description pane

**⚠️ Risks & Common Mistakes:**
- **Monaco bundle size** — Monaco is ~2MB; it MUST be loaded via `next/dynamic` with `ssr: false` or the page load time is terrible
- Web Workers not configured — Monaco uses Web Workers for syntax highlighting; without `MonacoEnvironment.getWorkerUrl` config, highlighting is broken/slow
- **Editor not resizing** — Monaco doesn't auto-resize when its container changes; call `editor.layout()` on window resize and split-pane drag
- React strict mode double-mounting — Monaco creates two editor instances in dev mode; use a ref to prevent double initialization
- Not disposing Monaco on unmount — calling `editor.dispose()` is required; skipping it leaks memory

---

### Story 5.2— Code Sync to Server
**As a** developer,
**I want** code changes streamed to the server in real-time,
**so that** the AI can observe what the user is writing.

**Completion:** InterviewWsProvider shares WS with VoiceInterview via wsRef. 300ms debounced code_edit over WS. 50KB client-side limit. Server code-session-store persists to Supabase every 30s. Programmatic changes (starter code load) filtered.

**Success Criteria:**
- [x] Monaco `onChange` debounced to 300ms fires a `code_edit` WS event
- [x] Event payload: `{ type: 'code_edit', code: string, language: string }`
- [x] After initial full sync, subsequent events send only the full code (diff-based deferred to post-MVP)
- [x] Server persists a code snapshot to Supabase every 30 seconds
- [x] Max code size enforced client-side (50KB) before sending
- [ ] Code changes are also fed into the voice agent's context (so interviewer can reference code)

**⚠️ Risks & Common Mistakes:**
- **Debounce too aggressive (>500ms)** — AI observer sees stale code; too low (<100ms) — floods the WS connection; 300ms is the sweet spot
- Not handling WS disconnection during sync — edits made while disconnected are lost; queue locally and replay on reconnect
- Monaco `onChange` fires on programmatic changes too — loading starter code triggers a sync event; filter out with a flag
- Server snapshot save not debounced separately — overlapping timers could double-save

---

### Story 5.3— Code Observer Agent (Anthropic Haiku)
**As a** user,
**I want** the AI to silently watch my code and feed insights to the interviewer,
**so that** the interviewer can give relevant guidance.

**Success Criteria:**
- [ ] `POST /api/internal/agents/observe-code` receives `{ sessionId, code, language }`
- [ ] Validates `X-Internal-Signature` HMAC + `Idempotency-Key`; rejects unsigned requests
- [ ] Calls Anthropic Claude Haiku 4.5 with the code observation prompt
- [ ] Returns structured JSON: `{ syntaxErrors, warnings, approach, estimatedComplexity, suggestRun }`
- [ ] Observation rate-limited to 1 call per 2 seconds per session
- [ ] Results cached in Redis for 5 seconds (identical code = cached response)
- [ ] Observer insights are injected into the Interviewer Agent's context for natural reference

**⚠️ Risks & Common Mistakes:**
- **Prompt producing inconsistent JSON** — LLMs don't always return valid JSON; use Anthropic's `response_format` or wrap in try/catch with fallback
- Calling the observer on partial/broken code — user mid-keystroke produces invalid syntax; observer should handle gracefully
- Rate limiting not enforced per-session — global rate limit means Session A's rapid edits block Session B; use per-session Redis keys
- Cache key not including language — same code in Python vs. JavaScript gets different analysis
- Insights injected too literally — interviewer shouldn't say "my observer agent tells me…"; prompt it to phrase naturally

---

### Story 5.4— Interview Screen Layout
**As a** user,
**I want** to see the problem, code editor, timer, and AI status on one screen,
**so that** I can focus on the interview without switching tabs.

**Success Criteria:**
- [ ] Interview page layout: left pane (problem description + examples), right pane (Monaco editor), top bar (timer + controls)
- [ ] Problem pane shows: title, description, constraints, example test cases, difficulty badge
- [ ] Timer shows `MM:SS` countdown with color changes (green → yellow at 5min → red at 1min)
- [ ] AI status indicator: "Listening…", "Thinking…", "Speaking…"
- [ ] "Run Code" button in editor toolbar
- [ ] "End Interview" button with confirmation dialog
- [ ] Layout is a minimum of 1024px wide (desktop-only for MVP)
- [ ] For interview/live coding routes on screens <1024px, show a desktop-required gate with a "Continue anyway" option

**⚠️ Risks & Common Mistakes:**
- **Layout breaking below 1024px** — users on small laptops (1366px) with DevTools open will be below 1024px; test at exactly 1024px
- Z-index conflicts between Monaco and modals — Monaco's internal layers use high z-index values; confirmation dialogs can appear behind the editor
- Timer color change not accessible — red/green invisible to color-blind users; add icon changes alongside colors
- AI status indicator stuck on "Thinking…" — if AI response fails silently, indicator never updates; add timeout that resets to "Listening…"
- Split pane not saving user's preferred sizes — persist in `localStorage`
- Desktop gate applied too broadly — only interview/live coding routes should be gated, not dashboard/auth/landing pages

---

## Epic 6: Code Execution

> **Keys needed:** Modal token ID + secret
> **Prompt user for keys before starting this epic.**

### Story 6.1 — Modal Sandbox Integration
**As a** user,
**I want** to run my code and see the output,
**so that** I can test my solution during the interview.

**Success Criteria:**
- [ ] `POST /api/sessions/[sessionId]/execute` sends code to Modal sandbox
- [ ] Modal container: ephemeral, gVisor-sandboxed, no network, 512MB RAM, 1 CPU, 5s timeout
- [ ] Supported runtimes: Python 3.12, Node.js 22, Java 21
- [ ] Returns `{ stdout, stderr, exitCode, duration_ms }`
- [ ] Infinite loops killed at 5s timeout; returns `{ error: 'Execution timed out' }`
- [ ] Rate limited: max 3 runs per minute per session
- [ ] Session must be `active` and owned by the authenticated user

**⚠️ Risks & Common Mistakes:**
- **Modal cold start** — first execution in a new container takes 2-5s; pre-warm containers or show a "Warming up…" message
- **Sandbox escape** — if using blacklist approach (blocking specific syscalls), attackers can find gaps; use seccomp allowlist
- Not disabling network — user code could make HTTP requests or exfiltrate data; `network_access=False` must be explicit
- Java compilation adds latency — `javac` + `java` is 2-step; 5s timeout may not be enough; consider 10s for Java
- Stdout/stderr not truncated — a print loop generates gigabytes; cap at 64KB
- Rate limit bypassed by opening multiple sessions — rate limit must be per-user, not just per-session

---

### Story 6.2— Test Case Runner
**As a** user,
**I want** to see which test cases my code passes,
**so that** I know if my solution is correct.

**Success Criteria:**
- [ ] On "Run Code", visible example test cases are executed against the user's code
- [ ] Results shown inline: ✅ pass / ❌ fail per test case with expected vs. actual output
- [ ] On "Submit" (or session end), hidden test cases are also run (results shown in evaluation only)
- [ ] Test case execution result is persisted as a `code_snapshot` with `snapshot_type = 'execution'`
- [ ] AI agent receives execution results and can comment on them ("Looks like test case 3 is failing…")
- [ ] Execution results stored in `code_snapshots.execution_result` JSONB field

**⚠️ Risks & Common Mistakes:**
- **Test harness code visible to user** — if you wrap user code in a test harness, the user sees the harness in stdout and can reverse-engineer hidden test cases; run harness in separate process or strip output
- **Floating point comparison** — `0.1 + 0.2 != 0.3` in all languages; use epsilon comparison for float outputs
- Whitespace/newline differences — trim and normalize whitespace before comparison
- Output comparison is string-based — if expected is `[1, 2, 3]` and user prints `[1,2,3]`, it fails; parse as JSON where possible
- Hidden test cases leaked via error messages — runtime errors may include the test input; sanitize error messages

---

### Story 6.3— Output Panel UI
**As a** user,
**I want** an output console below the editor showing execution results,
**so that** I can see stdout, stderr, and test case results.

**Success Criteria:**
- [ ] Console panel below Monaco editor, collapsible/expandable
- [ ] Shows "Running…" spinner while execution is in progress
- [ ] Renders stdout and stderr in monospaced font with ANSI color support
- [ ] Test case results in a table: input → expected → actual → pass/fail
- [ ] Execution time shown: "Completed in 42ms"
- [ ] Error states: timeout, runtime error, compilation error — each with clear messaging
- [ ] "Clear" button resets the console

**⚠️ Risks & Common Mistakes:**
- **ANSI escape codes rendering as raw text** — need an ANSI-to-HTML library (e.g., `ansi-to-html`)
- **XSS via stdout** — user code can print `<script>` tags; all output must be HTML-escaped; use `textContent` not `innerHTML`
- Large stdout crashing the browser — a print loop generating 1MB of DOM nodes freezes the tab; virtualize or cap at 1000 lines
- "Running…" spinner stuck forever — if API call fails silently, spinner never stops; add client-side timeout (15s)
- Panel resize conflicts with Monaco — resizing console panel should trigger `editor.layout()`

---

## Epic 7: Payments & Credits

> **Keys needed:** Stripe secret key, publishable key, webhook signing secret
> **Prompt user for keys before starting this epic.**

### Story 7.1 — Stripe Credit Purchase
**As a** user,
**I want** to buy credits with a credit card,
**so that** I can start more interview sessions.

**Success Criteria:**
- [ ] `POST /api/payments/create-intent` creates a Stripe PaymentIntent for selected credit package
- [ ] Credit packages: Starter (5 credits, $9.99), Pro (15 credits, $24.99), Unlimited Monthly ($49.99/mo)
- [ ] Stripe Elements checkout form rendered on `/billing` page
- [ ] `POST /api/payments/webhook` validates Stripe signature and processes `payment_intent.succeeded`
- [ ] On success: credits added atomically via `credit_transactions` insert + trigger
- [ ] Webhook handler is idempotent (deduplicate by Stripe event ID)
- [ ] Failed payment shows user-friendly error and retry option

**⚠️ Risks & Common Mistakes:**
- **Webhook signature verification skipped in dev** — developers often disable verification locally, then forget to re-enable; use `stripe listen --forward-to` for local testing
- **Not idempotent** — Stripe retries webhooks up to 3 times; without deduplication, users get triple credits
- Credits added before payment is confirmed — use the webhook (`payment_intent.succeeded`), not the client-side success callback
- Stripe API version mismatch — SDK version and dashboard API version must match; pin the API version
- Test mode vs. live mode keys mixed up — `sk_test_` vs `sk_live_`; add a check on startup

---

### Story 7.2— Subscription Management
**As a** user,
**I want** to subscribe to a monthly plan for unlimited sessions,
**so that** I can practice as much as I want.

**Success Criteria:**
- [ ] `POST /api/subscriptions/create` creates a Stripe Subscription
- [ ] `POST /api/subscriptions/cancel` cancels at period end
- [ ] `GET /api/subscriptions/portal` returns Stripe Customer Portal URL
- [ ] Subscription status synced via Stripe webhooks (`customer.subscription.updated`, `customer.subscription.deleted`)
- [ ] Active subscribers bypass credit checks on session start
- [ ] `/billing` page shows current plan, next billing date, and manage/cancel buttons
- [ ] Grace period: if webhook is delayed, allow session start for subscribed users and verify async

**⚠️ Risks & Common Mistakes:**
- **Not handling `past_due` status** — if payment fails, subscription goes to `past_due`; user still has access unless you explicitly check
- Customer portal redirect URL wrong — user clicks "Manage Subscription" and gets redirected to a 404
- **Subscription check caching** — if you cache subscription status and user cancels, they keep access until cache expires; use short TTL or webhook-driven invalidation
- Not creating a Stripe Customer before creating a subscription — Stripe requires a customer object
- Webhook events arriving out of order — use `created` timestamp to determine ordering

---

## Epic 8: Evaluator & Post-Interview Summary

> **Keys needed:** Anthropic API key (already configured in Epic 5)

### Story 8.1 — Evaluator Agent
**As a** user,
**I want** a detailed evaluation after my interview,
**so that** I know exactly how I performed and what to improve.

**Success Criteria:**
- [ ] `POST /api/internal/agents/evaluate` triggers on `session.ended` event via Redis Streams consumer
- [ ] Loads full transcript + all code snapshots + test results + problem details from Supabase
- [ ] Calls Anthropic Claude Sonnet 4.6 with the evaluation prompt
- [ ] Produces scores (1–10) for: Problem Solving, Code Quality, Communication, Efficiency
- [ ] Produces: overall score, strengths array, improvements array, hiring recommendation, detailed Markdown report
- [ ] Stores evaluation in `evaluations` table
- [ ] Validates `X-Internal-Signature`; rejects unsigned requests
- [ ] Handles Anthropic API errors gracefully: retry 2× then store `evaluation_status = 'failed'`

**⚠️ Risks & Common Mistakes:**
- **Evaluation prompt exceeding context window** — a 60-min session has ~30K words of transcript + code; Sonnet 4.6 has 1M token context so this should fit, but calculate and verify
- **LLM score inconsistency** — same interview evaluated twice may produce different scores; set `temperature: 0` for deterministic output
- Not handling empty transcripts — if user never spoke (mic issues), evaluator should produce code-only evaluation, not crash
- Evaluation taking >60s — Anthropic calls for large inputs can be slow; use streaming or accept async processing
- Storing raw Markdown without sanitization — if LLM includes HTML, it could cause XSS; sanitize before storage
- Retry logic retrying on non-retryable errors — 400 should not be retried; only retry on 429 and 500+

---

### Story 8.2— Summary Page UI
**As a** user,
**I want** to see my interview results on a summary page,
**so that** I can review my performance.

**Success Criteria:**
- [ ] `/sessions/[sessionId]/summary` page loads evaluation data
- [ ] Score display: four radial/bar gauges for each dimension (1–10 scale)
- [ ] Overall score prominently displayed with color coding (red/yellow/green)
- [ ] Hiring recommendation badge: "Strong Yes" / "Yes" / "Maybe" / "No"
- [ ] Strengths and improvements listed as bullet points
- [ ] Detailed report rendered as Markdown
- [ ] "Practice Again" button links to new session start
- [ ] If evaluation is still processing, show "Generating your evaluation…" and auto-refresh every 5 seconds (no 404)
- [ ] Return 404 only when session does not exist or user lacks access

**⚠️ Risks & Common Mistakes:**
- **Page loading before evaluation is ready** — without polling/SSE, user sees blank page or error; implement polling with a "Generating…" state and auto-refresh every 5 seconds
- Score charts not accessible — screen readers can't read canvas/SVG charts; add `aria-label` with numeric score
- Markdown rendering XSS — use a sanitizing Markdown renderer (e.g., `react-markdown` with `rehype-sanitize`); never use `dangerouslySetInnerHTML`
- Not handling `evaluation_status = 'failed'` — show "Evaluation failed" message instead of spinner or crash
- Color coding not meaningful without numbers — color-blind users can't distinguish red/yellow/green; always show numeric score

---

## Epic 9: Internal Security Hardening

> **Keys needed:** `INTERNAL_WEBHOOK_SECRET` (already configured)

### Story 9.1 — Internal Endpoint Security
**As a** developer,
**I want** all internal APIs secured against spoofing,
**so that** external attackers cannot trigger costly agent calls.

**Success Criteria:**
- [ ] Shared `verifyInternalSignature(body, signature, secret)` middleware for all `/api/internal/*` routes
- [ ] HMAC-SHA256 signature computed over raw request body + timestamp header
- [ ] Clock skew tolerance: ±30 seconds; reject stale requests
- [ ] `Idempotency-Key` header required; duplicate keys return cached response
- [ ] Idempotency keys stored in Redis with 24-hour TTL
- [ ] Fly.io ↔ internal API traffic is restricted with private networking and/or mTLS (no public unauthenticated path)
- [ ] Requests without valid signature return 403 with no error detail (prevent oracle attacks)
- [ ] CI test: forged signature → 403; valid signature → 200; replayed request → cached response
- [ ] Integration test: non-trusted/public network path cannot invoke `/api/internal/*`

**⚠️ Risks & Common Mistakes:**
- **HMAC computed over parsed JSON, not raw body** — `JSON.parse()` then `JSON.stringify()` changes key ordering; sign the raw request body bytes
- HMAC without network isolation — signatures alone are insufficient for high-value internal endpoints; enforce private networking/mTLS too
- Next.js API routes consume the body stream — you can't read the raw body after `req.json()`; use `config = { api: { bodyParser: false } }`
- Clock skew too strict — server and client clocks may differ by >30 seconds in cloud; 60 seconds is safer
- 403 with error detail — returning "invalid signature" vs "expired timestamp" gives attackers info; always return same generic 403
- Not logging rejected requests — log IP, timestamp, endpoint but not payload for attack visibility

---

### Story 9.2a — RLS Test Suite & Data Export/Delete
**As a** developer,
**I want** comprehensive RLS tests and user data portability endpoints,
**so that** data isolation is proven and users can export or delete their data.

**Success Criteria:**
- [ ] CI test suite using two test users (User A, User B)
- [ ] User A creates a session; User B cannot read it via API or direct Supabase query
- [ ] User A's transcripts, code snapshots, evaluations are invisible to User B
- [ ] User JWT cannot read `problem_solutions` table (expect 0 rows)
- [ ] User JWT cannot read hidden `test_cases` (only `is_example = TRUE AND is_hidden = FALSE`)
- [ ] `/api/users/data-export` returns only the requesting user's data
- [ ] `/api/users/data` (DELETE) removes all data for the requesting user and returns 204
- [ ] Delete cascade verified: all related tables (sessions → transcripts → snapshots → evaluations) are empty after delete
- [ ] Tests run in CI on every PR

**⚠️ Risks & Common Mistakes:**
- **Tests using service role key** — the most common mistake; service role bypasses ALL RLS; tests must use actual user JWTs
- Not testing direct Supabase queries — API-level tests only prove the API layer works; RLS tests must query Supabase directly with user JWT
- Test users not cleaned up — leftover test data pollutes the database; use `beforeAll/afterAll` cleanup
- Delete cascade not complete — deleting user data but leaving orphaned records; test all related tables are empty after delete
- Tests not running in CI — tests pass locally but aren't added to CI pipeline; add them explicitly

---

### Story 9.2b — PII Redaction & Data Retention
**As a** developer,
**I want** PII automatically redacted from transcripts and stale data purged on schedule,
**so that** we minimize compliance risk and storage costs.

**Success Criteria:**
- [ ] Transcript ingestion applies PII redaction (email, phone, SSN patterns) before persistence using regex patterns
- [ ] Redaction function is unit tested with sample data containing PII → verify PII replaced with `[REDACTED]`
- [ ] 90-day retention job implemented as a scheduled function (Vercel Cron or Supabase pg_cron)
- [ ] Retention job purges transcripts, code snapshots, and evaluations older than 90 days
- [ ] CI test verifies retention purge removes records older than policy threshold
- [ ] Retention job logs count of purged records for operational visibility
- [ ] Redaction and retention requirements are captured for Story 11.3 Privacy Policy implementation

**⚠️ Risks & Common Mistakes:**
- **Redaction only at export time** — if storage still contains raw PII, compliance risk remains; redact before persistence
- Regex too aggressive — redacting strings that look like phone numbers but are actually code (e.g., array indices); test against code samples
- Retention job not tested against realistic data volume — can timeout and silently skip old rows; use `LIMIT` + loop
- Retention job running without soft-delete — hard-deleting data with no recovery; consider 30-day soft-delete window before hard purge
- pg_cron not enabled on Supabase — must enable the extension in Supabase dashboard before scheduling

---

## Epic 10: End-to-End Integration & Polish

### Story 10.1a — E2E Test Infrastructure & Auth Flow
**As a** developer,
**I want** Playwright configured with mock providers and auth flow tested end-to-end,
**so that** we have a reliable E2E foundation to build integration tests on.

**Success Criteria:**
- [ ] Playwright installed and configured with `playwright.config.ts`
- [ ] Test helper: creates a test user, logs in, and returns an authenticated page context
- [ ] Mock WebSocket server for AI voice provider (returns canned audio responses)
- [ ] Mock `getUserMedia` for audio capture (Playwright headless has no mic)
- [ ] E2E test: sign up → land on dashboard → see 3 free credits → select a problem → arrive at interview setup page
- [ ] CI integration: Playwright tests run in GitHub Actions with `--project=chromium`
- [ ] Test database isolated from development (separate Supabase project or schema)

**⚠️ Risks & Common Mistakes:**
- **CI environment doesn't support audio** — Playwright in CI runs headless; `getUserMedia` won't work; mock the audio layer entirely
- Test database shared with development — E2E tests create/delete data; use a separate test project or database
- Playwright not installed in CI — `npx playwright install --with-deps chromium` must run in CI before tests
- Auth cookies not persisting between navigation — use `storageState` to persist auth across test steps

---

### Story 10.1b — E2E Full Interview Flow Test
**As a** developer,
**I want** the complete interview flow tested end-to-end,
**so that** I can verify all systems work together from session start to evaluation.

**Success Criteria:**
- [ ] E2E test: start session → WS connection established → receive AI greeting → type code in editor → run code (mocked execution) → end session
- [ ] Code observer called at least once during the session (verify via mock or API call log)
- [ ] After session end: evaluation generated within 30 seconds (with mocked evaluator)
- [ ] Summary page loads with scores, strengths, improvements, and hiring recommendation
- [ ] "Practice Again" button navigates to new session start
- [ ] Test passes in CI with mocked AI provider responses (no real API calls in CI)
- [ ] Response fixture files validated against real API response shapes

**⚠️ Risks & Common Mistakes:**
- **Playwright not handling WebSocket connections** — WS testing requires `page.on('websocket')` or a mock server; non-trivial to set up
- Tests flaky due to timing — use `expect.poll()` or `waitForSelector` with generous timeouts instead of `sleep(5000)`
- Mock responses not matching real API shapes — maintain a response fixture file validated against real API
- Session state leaking between tests — each test must create a fresh session; never rely on state from a previous test

---

### Story 10.2— Error Handling & Reconnection
**As a** user,
**I want** the app to handle network issues gracefully,
**so that** I don't lose my progress mid-interview.

**Success Criteria:**
- [ ] WS disconnect triggers exponential backoff reconnection (max 5 retries)
- [ ] On reconnect: client re-authenticates with a fresh WS token, timer resumes from server state
- [ ] Code editor state preserved locally; re-synced on reconnect
- [ ] If all retries fail: show "Connection lost" banner with manual retry button
- [ ] API errors show user-friendly toast messages (not raw error objects)
- [ ] Loading states shown for all async operations (session start, code execution, evaluation)

**⚠️ Risks & Common Mistakes:**
- **Reconnection loop hammering the server** — exponential backoff MUST have a maximum delay (30s) AND maximum attempt count; without this, server outage causes all clients to DDoS on recovery
- Fresh WS token on reconnect — original token is one-time-use; client must call `/api/realtime/token` again; if this call also fails, handle that
- Code state lost on reconnect — if code is only in Monaco's memory and WS reconnect clears the editor, user loses work; always save to `localStorage`
- Toast messages stacking — if 5 API calls fail simultaneously, 5 toasts appear; deduplicate or rate-limit toasts
- Error boundary not catching async errors — React error boundaries only catch rendering errors; API failures must be caught in calling code
- Add global error boundary — catches React crashes and shows "Something went wrong" with reload option

---

## Epic 11: Launch Readiness *(NEW — required for shippable MVP)*

> **Keys needed:** Sentry DSN, Fly.io auth token (already configured), Vercel account (already configured)

### Story 11.1 — CI/CD Pipeline
**As a** developer,
**I want** automated deployment for both Vercel (frontend) and Fly.io (realtime server),
**so that** every merge to main deploys to production without manual steps.

**Success Criteria:**
- [ ] GitHub Actions workflow: on push to `main` → run tests → deploy Vercel → deploy Fly.io
- [ ] Vercel deployment is automatic via GitHub integration (verify configured)
- [ ] Fly.io deployment via `flyctl deploy` in GitHub Actions with `FLY_API_TOKEN` secret
- [ ] Health check after Fly.io deploy: hit `/health` and verify 200 before marking deploy successful
- [ ] Pull request preview deployments on Vercel (verify working)
- [ ] Rollback instructions documented in README.md
- [ ] All tests (unit + RLS + E2E) run before deploy; failing tests block deployment

**⚠️ Risks & Common Mistakes:**
- **Fly.io deploy token expiring** — `FLY_API_TOKEN` has an expiration; deploys silently fail; set a calendar reminder to rotate
- **Deploying Fly.io before Vercel** — if Fly.io server depends on new Vercel API endpoints, deploying Fly.io first breaks the server; deploy Vercel first
- Health check passing too early — app returns 200 on `/health` before WS server is fully initialized; add readiness check verifying Redis connectivity
- Not caching `node_modules` in CI — builds take 3-5 min without caching; use `actions/cache`
- Preview deployments connecting to production Supabase — preview builds must use separate env vars

---

### Story 11.2 — Monitoring & Alerting
**As a** developer,
**I want** error tracking and performance monitoring,
**so that** I can detect and fix issues before users report them.

**Success Criteria:**
- [ ] Sentry SDK integrated in Next.js (client + server + edge)
- [ ] Source maps uploaded to Sentry on each deploy (readable stack traces)
- [ ] Fly.io server also reports errors to Sentry
- [ ] Alert rules: error rate >1% in 5 minutes → Sentry email notification (Slack optional)
- [ ] Custom Sentry tags: `sessionId`, `userId`, `provider` (for filtering)
- [ ] Cost monitoring: daily log of API costs (OpenAI, Anthropic, Modal) to a `costs` table or external dashboard
- [ ] Uptime check on Fly.io `/health` endpoint (UptimeRobot, Better Uptime, or similar free service)
- [ ] README.md updated with monitoring URLs and how to check system health

**⚠️ Risks & Common Mistakes:**
- **Sentry flooding with expected errors** — 404s, auth redirects, WS disconnects are not bugs; filter with `beforeSend` or they consume Sentry quota
- Source maps not uploaded — without them, Sentry shows minified stack traces; `@sentry/nextjs` handles this automatically
- Not setting `sampleRate` — 100% of transactions on a busy day exhausts the free tier; start with `tracesSampleRate: 0.1` (10%)
- Cost monitoring lag — API providers bill asynchronously; set hard budget caps on OpenAI and Anthropic dashboards
- Monitoring the wrong thing — uptime checks on `/health` don't catch WS issues; also monitor active WS connection count
- Not monitoring Redis memory — Redis OOM kills crash Fly.io server silently; alert on memory usage >80%

---

### Story 11.3 — Legal Pages, Mobile Gate & Rate Limiting
**As a** developer,
**I want** Terms of Service, Privacy Policy, mobile detection, and API rate limiting,
**so that** the platform is legally compliant, abuse-resistant, and guides users to the right device.

**Success Criteria:**
- [ ] `/terms` page with Terms of Service (template — final legal review by lawyer before public launch)
- [ ] `/privacy` page with Privacy Policy covering: data collected (voice transcripts, code, auth data), retention periods (90 days for transcripts), AI processing, third-party providers (OpenAI, Anthropic, Stripe)
- [ ] Footer links to Terms and Privacy on all pages
- [ ] Sign-up checkbox: "I agree to the Terms of Service and Privacy Policy" (required)
- [ ] Mobile detection on interview/live coding routes (`/interview/*`, active session pages): screens <1024px show "This platform requires a desktop browser" with a "Continue anyway" escape hatch
- [ ] Landing/auth/dashboard/billing/summary pages remain mobile-responsive
- [ ] API rate limiting: 60 requests/minute per user on public endpoints, 10 requests/minute on expensive endpoints (`/execute`, `/sessions/start`)
- [ ] Rate limit exceeded returns 429 with `Retry-After` header and user-friendly message

**⚠️ Risks & Common Mistakes:**
- **Using generic Terms template without AI/voice disclosures** — regulators (GDPR, CCPA) require explicit disclosure that user voice is processed by AI
- Terms page not versioned — if you update terms, track which version users agreed to; store `terms_accepted_at` and `terms_version` in profiles
- Mobile gate blocking tablets — iPads in landscape are >1024px and should work; detect by viewport width, not `navigator.userAgent`
- Rate limiting by IP instead of user ID — shared IPs (corporate networks) would rate-limit all users; use authenticated user ID
- Rate limit not applying to WebSocket messages — HTTP rate limiting doesn't protect the WS server; implement separate WS message rate limiting (Story 3.3 partially covers this)
- Cookie consent banner missing — EU users require cookie consent for tracking cookies

---

## Story Dependency Map

```
Epic 1 (Foundation)
  1.1 → 1.0 → 1.2 → 1.3 → 1.4a → 1.4b
  1.1 → 1.5 (landing page can parallel with auth)
                 ↓
Epic 2 (Sessions)
  2.1 → 2.2 → 2.3 → 2.4
         ↓
Epic 3 (Fly.io)          Epic 5 (Editor)       Epic 7 (Payments)
  3.1 → 3.2 → 3.3 → 3.4a → 3.4b   5.1 → 5.2 → 5.3 → 5.4   7.1 → 7.2
         ↓                         ↓
Epic 4 (Voice)            Epic 6 (Execution)
  4.1a → 4.1b → 4.2 → 4.3 → 4.4   6.1 → 6.2 → 6.3
  4.3 → 4.5 (onboarding needs audio)
                   ↓
              Epic 8 (Evaluator)
                8.1 → 8.2
                   ↓
              Epic 9 (Security)
                9.1 → 9.2a → 9.2b
                   ↓
              Epic 10 (Integration)
                10.1a → 10.1b → 10.2
                   ↓
              Epic 11 (Launch Readiness)
                11.1 → 11.2 → 11.3
```

**Parallelizable work:**
- Story 1.5 (landing page) can be done in parallel with Stories 1.2–1.4b.
- Epics 3, 5, and 7 can be worked in parallel after Epic 2 is complete.
- Epic 6 can start once Story 5.1 is done (needs the editor in place).
- Epic 4 requires Epic 3 (WS server) to be complete.
- Story 4.5 (onboarding) requires Story 4.3 (audio capture) to be complete.
- Epic 8 requires Epics 4 + 5 + 6 (needs voice, code observer, and execution).
- Epics 9 and 10 are final hardening and should come last.
- Epic 11 (Launch Readiness) is the final epic before shipping.

---

## Summary

| Epic | Stories | Total Points |
|------|---------|-------------|
| 1. Foundation & Auth | 7 | 14 |
| 2. Session Foundation | 4 | 8 |
| 3. Fly.io Server | 5 | 10 |
| 4. Voice Pipeline | 6 | 12 |
| 5. Editor & Observer | 4 | 8 |
| 6. Code Execution | 3 | 6 |
| 7. Payments | 2 | 4 |
| 8. Evaluator | 2 | 4 |
| 9. Security | 3 | 6 |
| 10. Integration | 3 | 6 |
| 11. Launch Readiness | 3 | 6 |
| **Total** | **42 stories** | **84 points** |

> **Completing all 42 stories produces a shippable MVP** — a product that can be deployed to production, accept real users, process payments, and operate reliably with monitoring and legal compliance.
> Point totals are baseline estimates; split any story that exceeds 2-point scope during sprint planning.
