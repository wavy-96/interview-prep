# Post-MVP Gap Analysis

> **UPDATE (Feb 22, 2026):** P0 gaps have been folded into the main user stories document.
> The 42 stories (84 points) in `user-stories.md` now produce a **shippable MVP**.

## ✅ What the 42 Stories Cover

All items from the original 31 stories PLUS:
- **Story 1.0** — Design system setup (Shadcn/UI, Aceternity, fonts, color palette)
- **Story 1.4a/1.4b** — Problems schema split (API+RLS separate from seeding 50 problems)
- **Story 1.5** — Landing page (hero, features, pricing, SEO, mobile-responsive)
- **Story 3.4a/3.4b** — Redis Streams split (publishing separate from consumer/DLQ)
- **Story 4.1a/4.1b** — Voice proxy split (core audio separate from transcripts/resilience)
- **Story 4.5** — Onboarding & microphone test (first-time user guided setup)
- **Story 9.2a/9.2b** — Security split (RLS tests separate from PII/retention)
- **Story 10.1a/10.1b** — E2E test split (infra setup separate from full flow test)
- **Story 11.1** — CI/CD pipeline (GitHub Actions for Vercel + Fly.io)
- **Story 11.2** — Monitoring & alerting (Sentry, cost monitoring, uptime checks)
- **Story 11.3** — Legal pages, mobile gate & rate limiting (Terms, Privacy, 429 handling)

## ⚠️ Remaining Gaps (Post-MVP, not blocking launch)

### P1 — Should fix after initial launch

| Gap | Why It Matters | Estimated Effort |
|-----|---------------|-----------------|
| **Email notifications** | User doesn't know when evaluation is ready | 1 story (2 pts) |
| **Session history detail** | Can view summary but can't replay the code timeline | 1 story (2 pts) |
| **Admin panel UI** | APIs exist but no UI for managing problems/test cases | 2 stories (4 pts) |
| **Data export/delete UI** | API exists but no settings page to trigger GDPR workflows | 1 story (2 pts) |
| **Terms of Service + Privacy Policy** | Legal requirement before collecting payment/voice data | External (legal) |
| **Rate limiting UI** | User hits rate limit but gets a raw error, not a helpful message | Trivial fix |

### P2 — Nice to have for growth

| Gap | Why It Matters | Estimated Effort |
|-----|---------------|-----------------|
| Progress tracking dashboard | Users want trend graphs, category breakdowns | 2 stories (4 pts) |
| Adaptive difficulty | System picks problem based on past performance | 1 story (2 pts) |
| Problem generation pipeline | LLM-generated problems to scale beyond curated set | 2 stories (4 pts) |
| Gamification (streaks, badges) | Retention driver | 2 stories (4 pts) |
| Hard difficulty problems | MVP is Easy + Medium only | 1 story (2 pts) |
| User-configurable AI persona | "Tough interviewer" vs "Friendly mentor" | 1 story (2 pts) |
| Text chat fallback | For users who can't use voice (noisy env, no mic) | 2 stories (4 pts) |

## Verdict

**The 42 stories produce a shippable MVP** — deployed, monitored, legally compliant, with 50 problems, onboarding, CI/CD, and rate limiting.

Post-launch, the P1 and P2 items above enhance the product but are not blocking for initial users.
