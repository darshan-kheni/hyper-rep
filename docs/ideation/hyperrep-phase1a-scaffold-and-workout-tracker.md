# HyperRep Phase 1a — Scaffold, Auth & Workout Tracker

**Slug:** hyperrep-phase1a-scaffold-and-workout-tracker
**Author:** Claude Code
**Date:** 2026-03-26
**Branch:** preflight/hyperrep-phase1a
**Related:** `HYPERREP-PHASE1A-TASK-BRIEF.md`, `FTNSS-GYM-ARCHITECTURE.md`, `hyperrep-prototype.jsx`

---

## 1) Intent & Assumptions

- **Task brief:** Build HyperRep Phase 1a — scaffold a Next.js 15 project with TypeScript and Tailwind, set up Supabase (Postgres + Auth + RLS), implement the Black & Electric Blue theme system, and build the core workout tracker with exercise logging, session timer, progress persistence, and a weekly dashboard. The prototype JSX serves as the UI reference.

- **Assumptions:**
  - This is a greenfield project — no existing Next.js code, only the JSX prototype and architecture docs
  - Supabase project already exists (user will provide URL + anon key)
  - Single-user focus for now (RLS is for future multi-user safety)
  - Deploying to Vercel (existing project per architecture doc)
  - Indian vegetarian male user context (60→80 kg weight gain goal)
  - 5-day split with Saturday rest, Sunday active recovery
  - Exercise data is static seed data for Month 1 (dynamic generation is Phase 4)
  - Mobile-first responsive design

- **Out of scope:**
  - Phase 2 (meal logging, food database, nutrition tracking)
  - Phase 3 (AI coach, Ollama integration)
  - Phase 4 (dynamic program generation, exercise substitution)
  - Payment/subscription features
  - Social features or multi-user sharing
  - Offline/PWA support (can be added later)
  - Automated testing setup

---

## 2) Pre-reading Log

- `FTNSS-GYM-ARCHITECTURE.md`: Full 4-phase architecture. Defines DB schema (8 tables for Phase 1), API routes, page structure, 4-week periodized program, UI theme CSS variables, file structure within Next.js, and build order estimates (~15-18 hrs for Phase 1).
- `HYPERREP-PHASE1A-TASK-BRIEF.md`: 10 detailed tasks covering scaffold, theme, Supabase setup, migration SQL, exercise seed data, program seed data, auth pages, dashboard, workout page, and settings. Includes acceptance criteria (15 checkboxes).
- `hyperrep-prototype.jsx`: 519-line single-file React prototype. Contains complete exercise library (33 exercises), 4-week program with weekly periodization, meal timeline, supplement data, and full UI with inline styles. No persistence — state resets on reload.
- `CLAUDE.md`: Template with `[CUSTOMIZE]` placeholders — needs to be updated for HyperRep specifics.
- `.claude/settings.json`: Hooks configured for `claudekit-hooks` (file-guard, lint, typecheck, test). These will activate once the Next.js project is scaffolded.
- `.claude/skills/README.md`: Empty skills directory — opportunity to create a HyperRep design system skill.
- No `package.json`, `tsconfig.json`, `next.config.*`, `.env*`, `src/`, `specs/`, or `developer-guides/` exist yet.
- Git: `main` branch, 0 commits, no remotes configured.

---

## 3) Codebase Map

- **Primary components/modules (to be created):**
  - `src/app/layout.tsx` — Root layout with theme provider, fonts
  - `src/app/(auth)/login/page.tsx` — Supabase email/password login
  - `src/app/(auth)/signup/page.tsx` — Registration with weight/goal inputs
  - `src/app/gym/layout.tsx` — App shell with sidebar nav + top bar
  - `src/app/gym/page.tsx` — Dashboard (weekly overview, day cards)
  - `src/app/gym/workout/page.tsx` — Today's workout with exercise list
  - `src/app/gym/workout/[sessionId]/page.tsx` — Active session view
  - `src/app/gym/settings/page.tsx` — Profile, gym time, weight logging
  - `src/components/gym/ExerciseCard.tsx` — Exercise with set checkboxes
  - `src/components/gym/SessionTimer.tsx` — Elapsed gym timer
  - `src/components/gym/RestTimer.tsx` — Between-set countdown
  - `src/components/gym/WeekTabs.tsx` — W1-W4 selector
  - `src/components/gym/DayCard.tsx` — Day overview for dashboard

- **Shared dependencies:**
  - `src/lib/supabase/client.ts` — Browser client (singleton)
  - `src/lib/supabase/server.ts` — Server client (per-request)
  - `src/middleware.ts` — Auth protection for `/gym/*`
  - `src/lib/gym/program-data.ts` — 4-week program seed data (from prototype)
  - `src/lib/gym/exercise-library.ts` — Exercise definitions
  - `next-themes` — Theme switching
  - `@supabase/ssr` — Auth + DB access
  - `recharts` — Weight/progress charts
  - `lucide-react` — Icons
  - `date-fns` — Date utilities

- **Data flow:**
  - Auth: Supabase Auth → middleware token refresh → server/client clients
  - Read: Server Component → `createClient()` (server) → Supabase query → render
  - Write: User action → Server Action → Supabase mutation → `revalidatePath` → re-render
  - Real-time: Exercise completion checkbox → optimistic UI → Server Action → Supabase `exercise_logs` insert

- **Feature flags/config:**
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
  - Dark mode default (stored in localStorage via `next-themes`)

- **Potential blast radius:**
  - Greenfield — no existing code to break
  - Supabase migration is destructive (creates tables) — run on clean project
  - `claudekit-hooks` will run on every file write once project is scaffolded (may slow development if tools aren't installed)

---

## 4) Root Cause Analysis

N/A — This is a greenfield feature build, not a bug fix.

---

## 5) Research

### Potential Solutions

#### A) Data Mutation Strategy

| Approach | Pros | Cons |
|----------|------|------|
| **1. Server Actions (recommended)** | Native Next.js integration, progressive enhancement, `revalidatePath` support, no API boilerplate | Must verify auth in every action, harder to test in isolation |
| **2. API Routes** | Familiar REST pattern, easy to test with curl/Postman, reusable by other clients | More boilerplate, no progressive enhancement, manual revalidation |
| **3. Direct Supabase client calls** | Simplest code, real-time subscriptions built-in | Exposes queries to client, harder to add business logic, RLS is sole security layer |

**Recommendation:** Use **Server Actions** for all mutations (log set, start/end session, update profile, log weight). Use direct Supabase client calls only for real-time subscriptions if needed later. Keep API routes for future external integrations (webhooks, AI endpoints in Phase 3).

#### B) RLS Strategy for Nested Tables

| Approach | Pros | Cons |
|----------|------|------|
| **1. Subquery-based policies** | Normalized schema, single source of truth for ownership | Slow on deep chains (user→program→template→template_exercises), complex policies |
| **2. Denormalize `user_id` onto all tables (recommended)** | Fast direct column check, simple policies, easy to index | Redundant data, must maintain consistency on writes |
| **3. SECURITY DEFINER functions** | Fast, normalized schema preserved | More complex to write/debug, bypasses RLS internally |

**Recommendation:** **Denormalize `user_id`** onto `workout_templates`, `template_exercises`, `workout_sessions`, and `exercise_logs`. The write paths are controlled (Server Actions), so consistency is manageable. Always wrap `auth.uid()` as `(select auth.uid())` for Postgres query planner optimization.

#### C) Exercise Logging UX

| Approach | Pros | Cons |
|----------|------|------|
| **1. Per-set checkbox with optimistic UI (recommended)** | Matches prototype, instant feedback, simple mental model | More DB writes (one per set) |
| **2. Batch save on "End Session"** | Fewer DB writes, simpler offline | Data loss risk if app crashes, no real-time progress |
| **3. Auto-save with debounce** | Seamless UX | Complex state management, hard to show save status |

**Recommendation:** **Per-set checkbox** matching the prototype. Use `useOptimistic` for instant UI feedback. Each checkbox toggles a single `exercise_logs` row. Pre-fill weight/reps from template targets, allow editing. Show previous session values as ghost text in future iterations.

#### D) Theme System

| Approach | Pros | Cons |
|----------|------|------|
| **1. `next-themes` + CSS variables + Tailwind `class` strategy (recommended)** | Zero flash, system preference detection, localStorage persistence, cross-tab sync | Extra dependency |
| **2. Manual implementation** | No dependency | Must handle FOUC, localStorage, system preference manually |

**Recommendation:** Use `next-themes` with `attribute="class"` and `defaultTheme="dark"`. Define theme tokens as CSS custom properties (matching the prototype's `c` object), reference them in Tailwind config. This matches the architecture doc's theme system exactly.

#### E) Auth Flow

| Approach | Pros | Cons |
|----------|------|------|
| **1. Supabase email/password (specified)** | Simple, no OAuth setup needed, works immediately | No social login |
| **2. Add OAuth later** | Better UX for users | More Supabase config, redirect handling |

**Recommendation:** Start with **email/password only** as specified. The architecture is extensible — OAuth can be added in a future phase by adding providers in Supabase dashboard and buttons on the login page.

### Overall Recommendation

Build Phase 1a with:
- **Next.js 16+ (latest)** App Router + TypeScript + **Tailwind CSS v4** (CSS-first config)
- **`@supabase/ssr`** for auth and DB (not deprecated auth-helpers)
- **Server Actions** for all mutations
- **`next-themes`** for dark/light toggle (dark default)
- **Denormalized `user_id`** on child tables for fast RLS
- **Per-set optimistic logging** matching the prototype UX
- **`(select auth.uid())`** pattern in all RLS policies
- **Inter + JetBrains Mono** fonts (per task brief)
- **Dual unit support** — lbs for exercise weights, kg for body weight, user-switchable
- **Scaffold in subdirectory** `hyperrep/` within the repo

---

## 6) Clarification — Resolved

All decisions have been clarified by the user (2026-03-26):

| # | Question | Decision |
|---|----------|----------|
| 1 | **Supabase project** | User has an existing Supabase project. Create `.env.example` with placeholders; user will fill in credentials. |
| 2 | **Deployment target** | Vercel eventually, but **no Vercel config for now**. Focus on local dev only. |
| 3 | **Scaffold location** | **(B) Subdirectory** — scaffold Next.js inside `hyperrep/` subdirectory. Use **Next.js 16+** (latest). |
| 4 | **`claudekit-hooks`** | **Install globally** (`npm install -g @anthropic/claudekit`). |
| 5 | **Weight units** | **Support both lbs and kg** — lbs for exercise weights, kg for body weight. User-switchable. |
| 6 | **Tailwind version** | **Tailwind v4** (CSS-first config, no `tailwind.config.ts`). |
| 7 | **Initial commit** | **No commit yet** — scaffold first, commit later. |
| 8 | **GitHub remote** | **Yes** — create a new GitHub repo and push. |
