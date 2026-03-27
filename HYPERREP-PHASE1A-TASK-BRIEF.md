# HyperRep — Claude Code Task Brief: Phase 1a

## Quick Context
HyperRep is a gym tracking + nutrition + AI coaching web app for a vegetarian male targeting 60→80 kg weight gain. Black & electric blue theme. This brief covers the initial scaffold, Supabase schema, auth, and the core workout tracker.

---

## Task 1: Project Scaffold

### Create a new Next.js 15 project called `hyperrep`

```bash
npx create-next-app@latest hyperrep --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd hyperrep
npm install @supabase/supabase-js @supabase/ssr lucide-react recharts date-fns clsx
```

### File structure to create:

```
src/
├── app/
│   ├── layout.tsx                    → Root layout with theme provider
│   ├── page.tsx                      → Landing/redirect to /gym
│   ├── globals.css                   → Theme CSS variables
│   ├── (auth)/
│   │   ├── login/page.tsx            → Email/password login
│   │   ├── signup/page.tsx           → Registration
│   │   └── layout.tsx                → Auth layout (centered card)
│   ├── gym/
│   │   ├── layout.tsx                → App shell: sidebar nav + top bar
│   │   ├── page.tsx                  → Dashboard (weekly overview)
│   │   ├── workout/
│   │   │   ├── page.tsx              → Today's workout
│   │   │   └── [sessionId]/page.tsx  → Active session view
│   │   ├── history/page.tsx          → Past sessions
│   │   ├── progress/page.tsx         → Weight + exercise charts
│   │   └── settings/page.tsx         → Profile, gym time, weight goal
│   └── api/gym/
│       ├── sessions/route.ts         → CRUD workout sessions
│       ├── exercises/log/route.ts    → Log set completions
│       ├── today/route.ts            → Get today's planned workout
│       ├── progress/route.ts         → Exercise weight history
│       └── weight/route.ts           → Weigh-in CRUD
├── components/gym/
│   ├── ExerciseCard.tsx              → Single exercise with set checkboxes
│   ├── SetRow.tsx                    → Individual set within exercise
│   ├── RestTimer.tsx                 → Countdown timer between sets
│   ├── SessionTimer.tsx              → Gym session elapsed timer
│   ├── ProgressBar.tsx               → Completion percentage bar
│   ├── WeekTabs.tsx                  → W1/W2/W3/W4 selector
│   ├── DayCard.tsx                   → Day overview card (for dashboard)
│   ├── WeightChart.tsx               → Recharts line chart for weight
│   └── ThemeToggle.tsx               → Dark/light mode toggle
├── components/ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 → Browser Supabase client
│   │   ├── server.ts                 → Server Supabase client (cookies)
│   │   ├── middleware.ts             → Auth middleware helper
│   │   └── types.ts                  → Generated DB types (placeholder)
│   └── gym/
│       ├── program-data.ts           → 4-week program seed data
│       ├── exercise-library.ts       → Exercise definitions
│       └── timeline.ts               → Adjust meal/workout times
├── middleware.ts                      → Protect /gym/* routes
└── data/
    └── exercises-seed.sql            → SQL insert for exercise library
```

---

## Task 2: Theme System

### `src/app/globals.css`

Set up the Black & Electric Blue dual theme using CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-primary: #F0F7FF;
    --bg-card: #FFFFFF;
    --bg-elevated: #E8F0FA;
    --text-primary: #0A0A0A;
    --text-secondary: #333333;
    --text-muted: #6B7B94;
    --border: #C8D8EC;
    --accent: #0066CC;
    --accent-hover: #004499;
    --accent-subtle: rgba(0, 102, 204, 0.06);
    --accent-glow: rgba(0, 102, 204, 0.15);
    --success: #00AA66;
    --warning: #CC8800;
    --error: #CC3333;
    --ring: #0066CC;
  }

  .dark {
    --bg-primary: #000000;
    --bg-card: #0A0A0A;
    --bg-elevated: #111111;
    --text-primary: #E8E8E8;
    --text-secondary: #AAAAAA;
    --text-muted: #555555;
    --border: #1A1A1A;
    --accent: #00AAFF;
    --accent-hover: #0088CC;
    --accent-subtle: rgba(0, 170, 255, 0.08);
    --accent-glow: rgba(0, 170, 255, 0.2);
    --success: #00CC88;
    --warning: #FFAA00;
    --error: #FF4444;
    --ring: #00AAFF;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
}
```

### `tailwind.config.ts` — extend with CSS variables:

```ts
theme: {
  extend: {
    colors: {
      bg: {
        primary: 'var(--bg-primary)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
      },
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      border: 'var(--border)',
      accent: {
        DEFAULT: 'var(--accent)',
        hover: 'var(--accent-hover)',
        subtle: 'var(--accent-subtle)',
        glow: 'var(--accent-glow)',
      },
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--error)',
    },
  },
}
```

Default to dark mode. Use `class` strategy for dark mode toggling.

---

## Task 3: Supabase Setup

### Environment variables needed in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

### `src/middleware.ts`

Protect all `/gym/*` routes. Redirect unauthenticated users to `/login`.

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/gym')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/gym/:path*'],
}
```

---

## Task 4: Database Migration SQL

Create this as `supabase/migrations/001_initial_schema.sql`. Run it in Supabase SQL editor or via CLI.

```sql
-- ============================================
-- HYPERREP: Initial Schema
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  current_weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2) DEFAULT 80.0,
  gym_start_time TIME DEFAULT '17:30',
  timezone TEXT DEFAULT 'America/Chicago',
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

-- 2. Exercise Library
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
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weeks INT DEFAULT 4,
  days_per_week INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Workout Templates
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_of_week INT NOT NULL,
  day_title TEXT NOT NULL,
  day_focus TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- 5. Template Exercises
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sets INT NOT NULL,
  reps TEXT NOT NULL,
  target_weight TEXT,
  rest_seconds INT DEFAULT 60,
  notes TEXT,
  sort_order INT NOT NULL,
  superset_group INT
);

-- 6. Workout Sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  program_id UUID REFERENCES programs(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT,
  mood_rating INT CHECK (mood_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Exercise Logs
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  template_exercise_id UUID REFERENCES template_exercises(id),
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

-- 8. Weight Logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  UNIQUE(user_id, logged_at)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users own their profile
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Exercises: readable by all authenticated users
CREATE POLICY "Exercises readable" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- Programs: users own their programs
CREATE POLICY "Users manage own programs" ON programs
  FOR ALL USING (auth.uid() = user_id);

-- Templates: accessible via program ownership
CREATE POLICY "Users access own templates" ON workout_templates
  FOR ALL USING (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

-- Template exercises: accessible via template → program chain
CREATE POLICY "Users access own template exercises" ON template_exercises
  FOR ALL USING (
    template_id IN (
      SELECT wt.id FROM workout_templates wt
      JOIN programs p ON wt.program_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Sessions: users own their sessions
CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Exercise logs: accessible via session ownership
CREATE POLICY "Users manage own exercise logs" ON exercise_logs
  FOR ALL USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  );

-- Weight logs: users own their logs
CREATE POLICY "Users manage own weight logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_programs_user ON programs(user_id);
CREATE INDEX idx_workout_templates_program ON workout_templates(program_id);
CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_template ON workout_sessions(template_id);
CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_weight_logs_user ON weight_logs(user_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Task 5: Exercise Library Seed Data

Create `src/data/exercises-seed.sql` with ~60 exercises covering all equipment and muscle groups. Here's the structure — generate the full list:

```sql
INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, movement_type, push_pull, difficulty, instructions, tips) VALUES

-- CHEST
('Chest Press Machine', 'chest', ARRAY['triceps', 'shoulders'], 'machine', 'compound', 'push', 'beginner',
 'Sit with back flat against pad. Grip handles at chest height. Press forward until arms extended. Return slowly.',
 'Keep shoulder blades pinched. Don''t lock elbows fully.'),

('Incline Chest Press Machine', 'chest', ARRAY['shoulders', 'triceps'], 'machine', 'compound', 'push', 'beginner',
 'Adjust seat so handles are at upper chest. Press upward at incline angle.',
 'Targets upper chest. Keep wrists neutral.'),

('Dumbbell Bench Press', 'chest', ARRAY['triceps', 'shoulders'], 'dumbbell', 'compound', 'push', 'intermediate',
 'Lie on flat bench with dumbbell in each hand at chest level. Press up until arms extended.',
 'Greater range of motion than machine. Control the descent.'),

('Cable Crossover', 'chest', ARRAY['shoulders'], 'cable', 'isolation', 'push', 'intermediate',
 'Set cables at high position. Step forward, bring handles together in arc motion.',
 'Squeeze at the bottom. Keep slight bend in elbows.'),

-- BACK
('Seated Row Machine', 'back', ARRAY['biceps', 'rear_delts'], 'machine', 'compound', 'pull', 'beginner',
 'Sit with chest against pad. Pull handles toward lower chest. Squeeze shoulder blades together.',
 'Don''t lean back. Pull with elbows, not hands.'),

('Lat Pulldown', 'back', ARRAY['biceps'], 'cable', 'compound', 'pull', 'beginner',
 'Grip bar wider than shoulders. Pull down to upper chest. Control the return.',
 'Lean slightly back. Pull elbows down and back.'),

('Cable Row', 'back', ARRAY['biceps', 'rear_delts'], 'cable', 'compound', 'pull', 'intermediate',
 'Sit at cable station. Pull handle to lower chest with neutral grip.',
 'Keep torso still. Squeeze at full contraction.'),

('Wide-Grip Lat Pulldown', 'back', ARRAY['biceps', 'rear_delts'], 'cable', 'compound', 'pull', 'intermediate',
 'Extra wide grip on lat bar. Pull to upper chest.',
 'Emphasizes outer lats. Wider back appearance.'),

('Close-Grip Lat Pulldown', 'back', ARRAY['biceps'], 'cable', 'compound', 'pull', 'intermediate',
 'Use V-bar or narrow handle. Pull to mid-chest.',
 'More bicep involvement. Good for thickness.'),

-- SHOULDERS
('Shoulder Press Machine', 'shoulders', ARRAY['triceps'], 'machine', 'compound', 'push', 'beginner',
 'Sit with back supported. Press handles overhead until arms extended.',
 'Don''t flare elbows past 45°. Full lockout at top.'),

('Dumbbell Shoulder Press', 'shoulders', ARRAY['triceps', 'core'], 'dumbbell', 'compound', 'push', 'intermediate',
 'Sit on bench with back support. Press dumbbells overhead from shoulder height.',
 'More stabilizer activation than machine. Keep core tight.'),

('Lateral Raise Machine', 'shoulders', ARRAY[]::TEXT[], 'machine', 'isolation', 'push', 'beginner',
 'Sit in machine. Raise pads outward to shoulder height. Lower slowly.',
 'Don''t go above shoulder height. Control the negative.'),

('Cable Lateral Raise', 'shoulders', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Stand sideways to cable. Raise arm out to side to shoulder height.',
 'Constant tension throughout range. Go light.'),

('Cable Face Pull', 'shoulders', ARRAY['rear_delts', 'upper_back'], 'cable', 'isolation', 'pull', 'beginner',
 'Set cable at face height. Pull rope to face, spreading ends apart. Squeeze rear delts.',
 'Best exercise for posture. Pull to forehead, not chest.'),

('Reverse Fly Machine', 'shoulders', ARRAY['upper_back'], 'machine', 'isolation', 'pull', 'beginner',
 'Sit facing pad. Open arms outward in reverse fly motion.',
 'Rear delt focus. Don''t use momentum.'),

('Arnold Press', 'shoulders', ARRAY['triceps'], 'dumbbell', 'compound', 'push', 'intermediate',
 'Start with palms facing you at chin height. Rotate and press overhead.',
 'Hits all three delt heads. Named after Arnold.'),

-- ARMS
('Bicep Curl Machine', 'arms', ARRAY[]::TEXT[], 'machine', 'isolation', 'pull', 'beginner',
 'Sit with arms on pad. Curl handles toward shoulders.',
 'Don''t swing. Slow controlled reps.'),

('Preacher Curl Machine', 'arms', ARRAY[]::TEXT[], 'machine', 'isolation', 'pull', 'beginner',
 'Arms resting on preacher pad. Curl up, lower slowly.',
 'Eliminates cheating. Great for strict form.'),

('Dumbbell Hammer Curl', 'arms', ARRAY['forearms'], 'dumbbell', 'isolation', 'pull', 'intermediate',
 'Hold dumbbells with neutral grip. Curl without rotating wrists.',
 'Targets brachialis and forearms. Good for arm thickness.'),

('Incline Dumbbell Curl', 'arms', ARRAY[]::TEXT[], 'dumbbell', 'isolation', 'pull', 'intermediate',
 'Sit on incline bench. Let arms hang. Curl up.',
 'Full stretch at bottom. Great for long head of bicep.'),

('EZ Bar Curl', 'arms', ARRAY['forearms'], 'barbell', 'isolation', 'pull', 'intermediate',
 'Grip EZ bar at angled portions. Curl to chest.',
 'Easier on wrists than straight bar.'),

('Tricep Pushdown (Cable)', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'beginner',
 'Grip bar or rope at cable station. Push down until arms straight. Elbows locked at sides.',
 'Don''t flare elbows. Squeeze at full extension.'),

('Tricep Rope Pushdown', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Use rope attachment. Push down and spread rope apart at bottom.',
 'Extra lateral head activation from the spread.'),

('Tricep Dip Machine', 'arms', ARRAY['chest'], 'machine', 'compound', 'push', 'beginner',
 'Grip handles. Push down until arms extended.',
 'Keep torso upright for tricep focus.'),

('Cable Overhead Tricep Extension', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Face away from cable. Extend rope overhead.',
 'Great stretch on long head of tricep.'),

-- LEGS
('Leg Press', 'legs', ARRAY['glutes'], 'machine', 'compound', NULL, 'beginner',
 'Sit in machine. Feet shoulder-width on platform. Press until legs nearly straight. Return slowly.',
 'Don''t lock knees. Push through heels.'),

('Leg Extension', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Sit in machine. Extend legs until straight. Squeeze quads. Lower slowly.',
 'Don''t use momentum. Squeeze hard at top.'),

('Leg Curl', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Lie face down or sit. Curl pad toward glutes. Control the return.',
 'Focus on hamstrings. Don''t let weight snap back.'),

('Hip Adductor', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Sit in machine. Squeeze legs inward against pads.',
 'Inner thigh focus. Go slow.'),

('Calf Raises', 'legs', ARRAY[]::TEXT[], 'bodyweight', 'isolation', NULL, 'beginner',
 'Stand on edge of step. Rise up on toes. Lower below step height.',
 'Full range of motion. Pause at top.'),

('Goblet Squat', 'legs', ARRAY['glutes', 'core'], 'dumbbell', 'compound', NULL, 'intermediate',
 'Hold dumbbell at chest. Squat to parallel. Drive up through heels.',
 'Teaches proper squat pattern. Keep chest up.'),

-- CORE
('Plank', 'core', ARRAY['shoulders'], 'bodyweight', 'isolation', NULL, 'beginner',
 'Forearms on ground. Body in straight line. Hold position.',
 'Squeeze glutes. Don''t let hips sag or pike up.'),

('Pushups', 'chest', ARRAY['triceps', 'shoulders', 'core'], 'bodyweight', 'compound', 'push', 'beginner',
 'Hands shoulder-width. Lower chest to floor. Push back up.',
 'Full range every rep. Keep core tight throughout.');
```

Generate the complete list with all exercises mentioned in the architecture doc. Every exercise that appears in the 4-week program tables must be in this seed data.

---

## Task 6: Program Seed Data

Create `src/lib/gym/program-data.ts` containing the full 4-week research-backed program as a TypeScript object. This data is used to seed the `programs`, `workout_templates`, and `template_exercises` tables for a new user.

Reference the exercise programming tables from the architecture doc (`FTNSS-GYM-ARCHITECTURE.md`). The key principle: exercises CHANGE across weeks.

```ts
export const DEFAULT_PROGRAM = {
  name: "Month 1 — Foundation to Strength",
  description: "4-week progressive program. W1-2 machines, W3 cables/dumbbells, W4 strength test.",
  weeks: 4,
  days_per_week: 5,
  schedule: [
    {
      week: 1,
      days: [
        {
          dayOfWeek: 1, // Monday
          title: "Push Day",
          focus: "Chest, Shoulders, Triceps",
          isRestDay: false,
          exercises: [
            { exerciseName: "Chest Press Machine", sets: 3, reps: "12", targetWeight: "30 lbs", restSeconds: 60, notes: "Keep shoulder blades pinched back", sortOrder: 1 },
            { exerciseName: "Incline Chest Press Machine", sets: 3, reps: "12", targetWeight: "25 lbs", restSeconds: 60, notes: "Upper chest focus", sortOrder: 2 },
            // ... full list from architecture doc
          ]
        },
        // ... all 7 days including rest and Sunday pushups
      ]
    },
    // ... weeks 2, 3, 4 with DIFFERENT exercises per the periodization plan
  ]
};
```

Include ALL 4 weeks with the exercise variations specified in the architecture doc.

Sunday (day 7) every week = pushup pyramid + stretching (active recovery, not rest).
Saturday (day 6) every week = full rest.
Friday (day 5) = leg day.

---

## Task 7: Auth Pages

### `/login` page
- Email + password form
- Link to signup
- Black & electric blue theme
- Supabase `signInWithPassword`
- Redirect to `/gym` on success

### `/signup` page
- Name, email, password, confirm password
- Current weight (kg), target weight (kg)
- Supabase `signUp` with metadata `{ name }`
- After signup, update `profiles` table with weight data
- Redirect to `/gym` on success

Both pages should be minimal, centered card layout. Use the accent blue for the submit button.

---

## Task 8: Dashboard Page (`/gym`)

The main dashboard showing:

1. **Header** — "HyperRep" logo, current week indicator, theme toggle
2. **Goal banner** — "60 → 80 kg" with current weight if logged
3. **Weekly progress bar** — overall completion percentage
4. **7 day cards** — Mon through Sun showing:
   - Day name + workout title
   - Exercise count
   - Completion status (done/partial/upcoming)
   - Click to navigate to `/gym/workout?day=X&week=Y`
5. **Quick stats** — total sessions this week, weight trend

Fetch data from Supabase: active program → templates for current week → session completion data.

---

## Task 9: Today's Workout Page (`/gym/workout`)

This is the core page. Features:

1. **Start Session button** — opens time picker for gym start time (default to profile's `gym_start_time`). Creates a `workout_session` row.

2. **Session timer** — elapsed time since start, shown in header.

3. **Exercise list** — each exercise shows:
   - Exercise name, muscle group tag
   - Target sets × reps × weight
   - Coaching notes
   - Individual set rows with checkboxes
   - When a set is checked, log it to `exercise_logs` table
   - Weight input per set (pre-filled with target, editable)
   - Reps input per set (pre-filled with target, editable)

4. **Rest timer** — when a set is completed, show countdown timer (60s, 90s based on exercise rest time). Auto-starts, can be dismissed.

5. **End Session button** — sets `ended_at`, calculates `duration_minutes`, optionally rate mood 1-5.

6. **Navigation** — previous/next workout buttons.

All completion data persists in Supabase in real-time. Page reload shows saved state.

---

## Task 10: Settings Page (`/gym/settings`)

- Edit name, current weight, target weight
- Set default gym start time (time picker)
- Set timezone
- Update profile in Supabase
- Log a weigh-in (weight_logs table)
- Sign out button

---

## Acceptance Criteria

Phase 1a is DONE when:

- [ ] `npm run dev` works with no errors
- [ ] Signup creates a user + profile in Supabase
- [ ] Login redirects to `/gym` dashboard
- [ ] Dashboard shows 7 day cards for current week
- [ ] Clicking a day opens the workout page with exercises
- [ ] User can input gym start time to begin a session
- [ ] Session timer counts up from start time
- [ ] Each set can be individually checked/unchecked (persisted to Supabase)
- [ ] Rest timer appears after completing a set
- [ ] Completing all sets marks the day as done on dashboard
- [ ] Weight can be logged in settings
- [ ] Dark mode (black + electric blue) is default
- [ ] Light mode toggle works
- [ ] All data persists across page reloads
- [ ] RLS prevents accessing other users' data

---

## Notes for Claude Code

- Use App Router (not Pages Router)
- Use Server Components where possible, Client Components only for interactive parts
- Use `@supabase/ssr` (not `@supabase/auth-helpers-nextjs` which is deprecated)
- Font: use `Inter` from `next/font/google` for body, `JetBrains Mono` for numbers/timers
- All Supabase queries should go through server actions or API routes, not directly from client except for real-time subscriptions
- Mobile-first responsive design
- Minimum viable — no over-engineering. Get it working, then polish.
