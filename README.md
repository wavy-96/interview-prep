# AI Interview Prep Platform

Practice technical interviews with an AI voice interviewer. Real-time code observation, execution, and post-interview evaluation.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the required keys for each epic. See `user-stories.md` for the pre-requisites table.

**Epic 1 (Auth & Profiles):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key

Enable Email provider in Supabase Dashboard → Authentication → Providers. Add redirect URL: `http://localhost:3000/auth/callback` (or your production origin).

**Database (Story 1.3):** Project `interview-prep-mvp` is linked. Migrations applied.

**Seed 50 Problems (Story 1.4b):** Run `npm run db:seed` (gated to `NODE_ENV=development` or `FORCE_SEED=1`). Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

Add to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL=https://zlasadqmgwfcxwulyvif.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from [Dashboard → Settings → API](https://supabase.com/dashboard/project/zlasadqmgwfcxwulyvif/settings/api)

## Project Structure

- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — Reusable UI components (Shadcn, Aceternity)
- `src/components/ui/` — Shadcn + Aceternity primitives
- `src/lib/` — Utilities (cn, etc.)

## Design System

- **Fonts:** Inter (body), Lora (headings), JetBrains Mono (code)
- **Colors:** paper, ink, brand-clay, brand-forest, status-*
- **Test page:** `/design` (dev only) — verifies fonts, colors, components

## Documentation

- `user-stories.md` — 42 stories across 11 epics
- `technical-architecture.md` — System design and database schema
- `design-style-guide.md` — Visual identity and typography
- `design-components.md` — Component library checklist
