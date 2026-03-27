# Phase 1a — Project Scaffold, Auth & Workout Tracker

**Status:** Draft
**Authors:** Claude Code, 2026-03-26
**Ideation:** `docs/ideation/hyperrep-phase1a-scaffold-and-workout-tracker.md`
**Prototype:** `hyperrep-prototype.jsx`
**Architecture:** `FTNSS-GYM-ARCHITECTURE.md`

---

## 1. Overview

HyperRep is a gym tracking web app for a vegetarian male targeting 60→80 kg weight gain. Phase 1a delivers the foundational scaffold: a Next.js 16+ project with Supabase auth, a research-backed 4-week workout program, exercise logging with per-set persistence, a session timer, and a weekly dashboard — all in a Black & Electric Blue theme.

---

## 2. Background / Problem Statement

The user has a JSX prototype (`hyperrep-prototype.jsx`) that demonstrates the complete UI and program data but has no persistence, no auth, and no real backend. Checkboxes reset on reload. There's no gym timer, no weight tracking, and no progressive overload history. This spec converts that prototype into a production-ready app with real data persistence via Supabase.

---

## 3. Goals

- Scaffold a Next.js 16+ project in `hyperrep/` subdirectory with TypeScript and Tailwind v4
- Implement Supabase email/password authentication with protected routes
- Create the database schema (8 tables) with Row Level Security
- Seed the exercise library (~33 exercises) and 4-week program data
- Build the weekly dashboard with day cards and completion tracking
- Build the workout page with per-set checkbox logging (persisted to Supabase)
- Implement gym session timer (start time input, elapsed counter)
- Implement rest timer between sets (auto-start on set completion)
- Support dark mode (default) and light mode toggle
- Support both lbs (exercise weights) and kg (body weight) units
- Build settings page for profile, gym time, and weight logging
- Create GitHub repo and push

---

## 4. Non-Goals

- Meal logging, food database, nutrition tracking (Phase 2)
- AI coach, Ollama integration (Phase 3)
- Dynamic program generation, exercise substitution (Phase 4)
- Vercel deployment configuration
- Offline/PWA support
- OAuth/social login
- Multi-user sharing or social features
- Automated test suite setup
- Mobile native app

---

## 5. Technical Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16+ (latest) | App framework |
| `react` / `react-dom` | 19+ | UI library |
| `typescript` | 5+ | Type safety |
| `tailwindcss` | 4+ | CSS-first styling |
| `@supabase/supabase-js` | 2+ | Supabase client |
| `@supabase/ssr` | 0.5+ | SSR auth helpers |
| `next-themes` | latest | Dark/light mode |
| `lucide-react` | latest | Icons |
| `recharts` | 2+ | Charts (weight/progress) |
| `date-fns` | 3+ | Date utilities |
| `clsx` | latest | Conditional classnames |

---

## 6. Detailed Design

### 6.1 Project Structure

```
hyper-rep/                          # Repo root (planning docs, .claude)
└── hyperrep/                       # Next.js project (scaffolded here)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                    # Root layout: ThemeProvider, fonts
    │   │   ├── page.tsx                      # Landing → redirect to /gym
    │   │   ├── globals.css                   # Tailwind v4 + CSS theme variables
    │   │   ├── (auth)/
    │   │   │   ├── layout.tsx                # Centered card layout
    │   │   │   ├── login/page.tsx            # Email/password login
    │   │   │   └── signup/page.tsx           # Registration + weight inputs
    │   │   └── gym/
    │   │       ├── layout.tsx                # App shell: nav + header
    │   │       ├── page.tsx                  # Dashboard (weekly overview)
    │   │       ├── workout/
    │   │       │   ├── page.tsx              # Today's workout
    │   │       │   └── [sessionId]/page.tsx  # Active session view
    │   │       ├── history/page.tsx          # Past sessions
    │   │       ├── progress/page.tsx         # Weight + exercise charts
    │   │       └── settings/page.tsx         # Profile, gym time, weight
    │   ├── components/
    │   │   ├── gym/
    │   │   │   ├── ExerciseCard.tsx          # Exercise with set rows
    │   │   │   ├── SetRow.tsx                # Individual set checkbox + inputs
    │   │   │   ├── RestTimer.tsx             # Between-set countdown
    │   │   │   ├── SessionTimer.tsx          # Elapsed gym timer
    │   │   │   ├── ProgressBar.tsx           # Completion bar
    │   │   │   ├── WeekTabs.tsx              # W1-W4 selector
    │   │   │   ├── DayCard.tsx               # Day overview card
    │   │   │   ├── WeightChart.tsx           # Recharts line chart
    │   │   │   └── ThemeToggle.tsx           # Dark/light toggle
    │   │   └── ui/
    │   │       ├── Button.tsx
    │   │       ├── Input.tsx
    │   │       ├── Card.tsx
    │   │       └── Modal.tsx
    │   ├── lib/
    │   │   ├── supabase/
    │   │   │   ├── client.ts                # Browser client (singleton)
    │   │   │   ├── server.ts                # Server client (per-request)
    │   │   │   └── types.ts                 # Generated DB types
    │   │   └── gym/
    │   │       ├── program-data.ts           # 4-week program seed data
    │   │       ├── exercise-library.ts       # Exercise definitions
    │   │       └── actions.ts                # Server Actions for mutations
    │   ├── middleware.ts                     # Protect /gym/* routes
    │   └── data/
    │       └── exercises-seed.sql            # SQL insert for exercise library
    ├── supabase/
    │   └── migrations/
    │       ├── 001_initial_schema.sql        # Tables + RLS + indexes
    │       └── 002_exercise_seed.sql         # Exercise library data
    ├── .env.example                          # Placeholder env vars
    ├── next.config.ts
    ├── package.json
    └── tsconfig.json
```

### 6.2 Database Schema

8 tables with denormalized `user_id` for fast RLS:

```sql
-- 1. profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  current_weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2) DEFAULT 80.0,
  gym_start_time TIME DEFAULT '17:30',
  preferred_weight_unit TEXT DEFAULT 'lbs',  -- 'lbs' or 'kg'
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. exercises (master library)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT[],
  equipment TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  push_pull TEXT,
  difficulty TEXT DEFAULT 'beginner',
  instructions TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weeks INT DEFAULT 4,
  days_per_week INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. workout_templates (denormalized user_id)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_of_week INT NOT NULL,
  day_title TEXT NOT NULL,
  day_focus TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- 5. template_exercises (denormalized user_id)
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sets INT NOT NULL,
  reps TEXT NOT NULL,
  target_weight TEXT,
  rest_seconds INT DEFAULT 60,
  notes TEXT,
  sort_order INT NOT NULL,
  superset_group INT
);

-- 6. workout_sessions (denormalized user_id)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  program_id UUID REFERENCES programs(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT,
  mood_rating INT CHECK (mood_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. exercise_logs (denormalized user_id)
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  template_exercise_id UUID REFERENCES template_exercises(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  reps_completed INT,
  weight_used DECIMAL(6,2),
  weight_unit TEXT DEFAULT 'lbs',
  duration_seconds INT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  rpe INT CHECK (rpe BETWEEN 1 AND 10),
  notes TEXT
);

-- 8. weight_logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  UNIQUE(user_id, logged_at)
);
```

### 6.3 RLS Policies

All policies use `(select auth.uid())` for query planner optimization:

```sql
-- Simple direct ownership
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING ((select auth.uid()) = id);

CREATE POLICY "own_programs" ON programs
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "own_templates" ON workout_templates
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "own_template_exercises" ON template_exercises
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "own_sessions" ON workout_sessions
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "own_exercise_logs" ON exercise_logs
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "own_weight_logs" ON weight_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- Exercises readable by all authenticated
CREATE POLICY "exercises_readable" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 6.4 Auth Flow

```
User visits /gym/* (unauthenticated)
  → middleware.ts intercepts
  → createServerClient reads cookies, calls supabase.auth.getUser()
  → No user → redirect to /login

/login page:
  → Email + password form
  → Server Action calls supabase.auth.signInWithPassword()
  → On success → redirect to /gym
  → On error → show error message

/signup page:
  → Name, email, password, confirm password
  → Current weight (kg), target weight (kg)
  → Server Action calls supabase.auth.signUp({ metadata: { name } })
  → Trigger auto-creates profile row
  → Server Action updates profile with weight data
  → Redirect to /gym

Sign out:
  → Server Action calls supabase.auth.signOut()
  → Redirect to /login
```

### 6.5 Theme System (Tailwind v4 + CSS Variables)

`globals.css` — CSS-first config (no tailwind.config.ts):

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: var(--bg-primary);
  --color-bg-card: var(--bg-card);
  --color-bg-elevated: var(--bg-elevated);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-border: var(--border-color);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-subtle: var(--accent-subtle);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
}

@layer base {
  :root {
    --bg-primary: #F0F7FF;
    --bg-card: #FFFFFF;
    --bg-elevated: #E8F0FA;
    --text-primary: #0A0A0A;
    --text-secondary: #333333;
    --text-muted: #6B7B94;
    --border-color: #C8D8EC;
    --accent: #0066CC;
    --accent-hover: #004499;
    --accent-subtle: rgba(0, 102, 204, 0.06);
    --success: #00AA66;
    --warning: #CC8800;
    --error: #CC3333;
  }

  .dark {
    --bg-primary: #000000;
    --bg-card: #0A0A0A;
    --bg-elevated: #111111;
    --text-primary: #E8E8E8;
    --text-secondary: #AAAAAA;
    --text-muted: #555555;
    --border-color: #1A1A1A;
    --accent: #00AAFF;
    --accent-hover: #0088CC;
    --accent-subtle: rgba(0, 170, 255, 0.08);
    --success: #00CC88;
    --warning: #FFAA00;
    --error: #FF4444;
  }
}
```

`next-themes` setup: `attribute="class"`, `defaultTheme="dark"`, `storageKey="hyperrep-theme"`.

### 6.6 Data Mutation Pattern — Server Actions

All mutations go through Server Actions in `src/lib/gym/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Example: Toggle set completion
export async function toggleSetCompletion(
  sessionId: string,
  exerciseId: string,
  templateExerciseId: string,
  setNumber: number,
  isCompleted: boolean,
  weight: number,
  reps: number,
  weightUnit: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (isCompleted) {
    await supabase.from('exercise_logs').insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      template_exercise_id: templateExerciseId,
      user_id: user.id,
      set_number: setNumber,
      reps_completed: reps,
      weight_used: weight,
      weight_unit: weightUnit,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
  } else {
    await supabase.from('exercise_logs').delete().match({
      session_id: sessionId,
      template_exercise_id: templateExerciseId,
      set_number: setNumber,
      user_id: user.id,
    })
  }

  revalidatePath('/gym/workout')
}
```

### 6.7 Workout Page — Core UX

The workout page (`/gym/workout`) is the most complex page:

1. **Route:** `/gym/workout?week=1&day=1` (defaults to current week/day)
2. **Data loading:** Server Component fetches active program → template for week/day → template exercises with exercise details → existing session + logs for today
3. **Start Session:** Client component with time picker (defaults to profile's `gym_start_time`). Creates `workout_sessions` row via Server Action.
4. **Exercise List:** Each `ExerciseCard` is a Client Component showing:
   - Exercise name + equipment tag + muscle group
   - Target sets x reps x weight (from template)
   - Coaching notes
   - Individual `SetRow` components with:
     - Set number
     - Weight input (pre-filled from template target, editable)
     - Reps input (pre-filled, editable)
     - Completion checkbox → triggers `toggleSetCompletion` Server Action
     - Optimistic UI via `useOptimistic`
5. **Rest Timer:** When a set is completed, auto-show countdown (rest_seconds from template). Dismissible. Audio ping on completion (optional).
6. **Session Timer:** Sticky in header, shows elapsed time since `started_at`.
7. **End Session:** Sets `ended_at`, calculates `duration_minutes`, optional mood rating (1-5 stars).
8. **Navigation:** Previous/Next day buttons. Week tabs at top.

### 6.8 Dashboard Page

Server Component that fetches:
- Active program for current user
- All templates for current week
- Session completion data (exercise_logs) for each day

Renders:
- "HYPERREP" header with theme toggle
- Goal banner ("60 → 80 kg" with current weight from latest weight_log)
- Week tabs (W1-W4) with completion percentages
- 7 day cards showing: day name, workout title, focus, exercise count, completion status (done/partial/upcoming/rest), "NEW EXERCISES" badge if week has cable/dumbbell exercises
- Click day card → navigate to `/gym/workout?week=X&day=Y`

### 6.9 Settings Page

- Edit name, current weight (kg), target weight (kg)
- Set default gym start time (time picker)
- Set preferred weight unit (lbs/kg toggle)
- Set timezone
- Log a weigh-in (creates weight_logs row)
- Sign out button

### 6.10 Program Seeding

On first login (no active program found), automatically seed the user's program from `program-data.ts`. This file contains the complete 4-week program matching the prototype's `PROGRAM` constant, with all exercise variations per week.

The seeding flow:
1. Dashboard Server Component checks for active program
2. If none exists, call `seedDefaultProgram` Server Action
3. Server Action creates: 1 program → 28 workout_templates (4 weeks x 7 days) → ~150 template_exercises
4. All rows get the user's `user_id` for RLS

---

## 7. User Experience

### User Journey (Happy Path)

1. User visits `/` → redirected to `/login`
2. Signs up with name, email, password, weight → redirected to `/gym`
3. Dashboard shows Week 1 with 7 day cards
4. Clicks "Monday — Push Day" → workout page
5. Clicks "Start Gym Session" → time picker → session starts, timer running
6. Sees 5 exercises, each with sets/reps/weight
7. Checks off sets as they complete them → rest timer auto-starts
8. Finishes all exercises → clicks "End Session" → rates mood
9. Returns to dashboard → Monday card shows "DONE" badge
10. Clicks W2 tab → sees new exercises for Week 2
11. Goes to Settings → logs a weigh-in → weight chart updates

### Error States

- Network failure during set logging → optimistic state rolls back, toast error
- Session expires → middleware redirects to login, return URL preserved
- No program exists → auto-seed on first dashboard visit
- Supabase unavailable → error boundary with retry button

---

## 8. Testing Strategy

Testing setup is deferred (non-goal for Phase 1a), but the architecture supports:

- **Unit tests:** Server Actions can be tested with mocked Supabase client
- **Integration tests:** Test RLS policies directly via Supabase SQL editor
- **E2E tests:** Playwright for auth flow, workout completion flow, theme toggle
- **Manual testing checklist:** Included in acceptance criteria below

---

## 9. Performance Considerations

- **Server Components by default** — only ExerciseCard, SetRow, RestTimer, SessionTimer, ThemeToggle need `'use client'`
- **Per-set writes** are small (single row insert/delete), not batched
- **RLS with denormalized `user_id`** — direct column check, indexed, no subquery joins
- **`(select auth.uid())`** wrapper in all policies for Postgres planner caching
- **Indexes** on all `user_id` columns, `program_id`, `template_id`, `session_id`, `exercise_id`, `muscle_group`
- **Font loading:** `next/font/google` for Inter + JetBrains Mono (self-hosted, no layout shift)

---

## 10. Security Considerations

- **Auth:** Supabase email/password with JWT tokens via httpOnly cookies
- **Middleware:** Validates auth on every `/gym/*` request using `supabase.auth.getUser()` (validates JWT, not just reads session)
- **RLS:** All tables have row-level security; user can only access own data
- **Server Actions:** Always verify `auth.getUser()` before mutations
- **CSRF:** Next.js Server Actions have built-in CSRF protection
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose (RLS protects data)
- **No secrets in client code:** Database operations go through Supabase client with anon key + RLS

---

## 11. Documentation

- Update `CLAUDE.md` with HyperRep-specific project details (replace `[CUSTOMIZE]` placeholders)
- Create `.env.example` with required environment variables
- Create `supabase/migrations/` with numbered SQL files

---

## 12. Implementation Phases

### Phase 1a-1: Scaffold & Theme (do first)
- `create-next-app` in `hyperrep/` subdirectory
- Install all dependencies
- Set up `globals.css` with Tailwind v4 theme variables
- Set up `next-themes` with dark default
- Create `.env.example`
- Create UI primitives (Button, Input, Card)
- Set up fonts (Inter, JetBrains Mono)

### Phase 1a-2: Supabase & Auth
- Create Supabase client utilities (browser + server)
- Create middleware for route protection
- Create database migration SQL
- Build login page
- Build signup page with weight inputs
- Test auth flow end-to-end

### Phase 1a-3: Data Seeding
- Create exercise library seed SQL (~33 exercises from prototype)
- Create program-data.ts (4-week program from prototype)
- Build auto-seed Server Action for new users

### Phase 1a-4: Dashboard
- Build WeekTabs component
- Build DayCard component
- Build ProgressBar component
- Build dashboard page with data fetching
- Wire up completion percentage calculations

### Phase 1a-5: Workout Page (core)
- Build ExerciseCard + SetRow components
- Build SessionTimer component
- Build RestTimer component
- Create Server Actions (toggleSet, startSession, endSession)
- Wire up optimistic UI for set completion
- Build workout page with data fetching

### Phase 1a-6: Settings & Polish
- Build settings page (profile, gym time, weight unit)
- Build weight logging
- Build WeightChart with recharts
- Build gym app shell layout (header + nav)
- GitHub repo creation and push

---

## 13. Acceptance Criteria

- [ ] `npm run dev` works with no errors in `hyperrep/` directory
- [ ] Signup creates a user + profile in Supabase
- [ ] Login redirects to `/gym` dashboard
- [ ] Dashboard shows 7 day cards for current week
- [ ] Week tabs (W1-W4) switch the displayed week with completion percentages
- [ ] Clicking a day opens the workout page with correct exercises for that week/day
- [ ] Exercises CHANGE across weeks (W1-2 machines, W3 cables/dumbbells, W4 heavy)
- [ ] User can input gym start time to begin a session
- [ ] Session timer counts up from start time (visible in header)
- [ ] Each set can be individually checked/unchecked (persisted to Supabase)
- [ ] Weight and reps are editable per set (pre-filled from template)
- [ ] Rest timer appears after completing a set (configurable per exercise)
- [ ] Completing all sets marks the day as done on dashboard
- [ ] Weight can be logged in settings (kg)
- [ ] Exercise weights support both lbs and kg
- [ ] Dark mode (black + electric blue) is the default theme
- [ ] Light mode toggle works with no flash
- [ ] All data persists across page reloads
- [ ] RLS prevents accessing other users' data
- [ ] New user gets auto-seeded with the 4-week program on first visit
- [ ] GitHub repo created and code pushed

---

## 14. Open Questions

None — all clarifications resolved during ideation.

---

## 15. References

- **Ideation:** `docs/ideation/hyperrep-phase1a-scaffold-and-workout-tracker.md`
- **Architecture:** `FTNSS-GYM-ARCHITECTURE.md`
- **Task Brief:** `HYPERREP-PHASE1A-TASK-BRIEF.md`
- **UI Prototype:** `hyperrep-prototype.jsx`
- **Supabase SSR docs:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **Next.js App Router docs:** https://nextjs.org/docs/app
- **Tailwind v4 docs:** https://tailwindcss.com/docs
- **next-themes:** https://github.com/pacocoursey/next-themes
