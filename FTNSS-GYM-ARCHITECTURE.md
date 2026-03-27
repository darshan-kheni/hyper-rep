# FTNSS Gym Tracker — Architecture & Build Plan

**Goal:** 60 kg → 80 kg weight gain tracker with workout logging, meal tracking, supplement protocol, and AI coaching.

**Stack:** Next.js 15 (existing project on Vercel) + Supabase (Postgres + Auth) + Ollama Cloud API

**Auth:** Supabase email/password

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                 │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Workout  │ │  Meal    │ │  AI      │ │ Dashboard  │ │
│  │ Tracker  │ │  Logger  │ │  Coach   │ │ + Progress │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴────┐  │
│  │              API Routes (/api/*)                   │  │
│  └────┬─────────────┬────────────┬──────────────┬────┘  │
└───────┼─────────────┼────────────┼──────────────┼───────┘
        │             │            │              │
   ┌────┴────┐   ┌────┴────┐  ┌───┴───┐   ┌─────┴─────┐
   │Supabase │   │Supabase │  │Ollama │   │ Supabase  │
   │  Auth   │   │Postgres │  │ Cloud │   │ Realtime  │
   └─────────┘   └─────────┘  │  API  │   └───────────┘
                               └───────┘
```

---

## Phase 1: Core Workout Tracker + Supabase

### Features
- Research-backed 5-day split with dynamic exercise selection
- Gym session timer (user inputs start time, timeline adjusts)
- Exercise completion tracking (persisted in Supabase)
- Weekly progress view with completion percentages
- Weight progression tracking per exercise

### Database Schema

```sql
-- Users profile (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  current_weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  gym_start_time TIME DEFAULT '17:30',  -- user's typical gym time
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workout programs (the 4-week plan structure)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "Month 1 — Foundation to Strength"
  weeks INT DEFAULT 4,
  days_per_week INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercise library (master list of all exercises)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,     -- 'chest', 'back', 'shoulders', 'legs', 'arms', 'core'
  equipment TEXT NOT NULL,        -- 'machine', 'cable', 'barbell', 'dumbbell', 'bodyweight'
  movement_type TEXT NOT NULL,    -- 'compound', 'isolation'
  push_pull TEXT,                 -- 'push', 'pull', null (for legs/core)
  difficulty TEXT DEFAULT 'beginner',  -- 'beginner', 'intermediate', 'advanced'
  instructions TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout templates (what exercises are planned for each day)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  week_number INT NOT NULL,       -- 1-4
  day_of_week INT NOT NULL,       -- 1=Mon, 2=Tue... 7=Sun
  day_title TEXT NOT NULL,        -- "Push Day", "Pull Day", "Leg Day"
  day_focus TEXT,                 -- "Chest, Shoulders, Triceps"
  is_rest_day BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- Template exercises (exercises within a workout template)
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sets INT NOT NULL,
  reps TEXT NOT NULL,             -- "12" or "20s hold" or "8-10"
  weight TEXT,                    -- "30 lbs" or "BW"
  rest_seconds INT DEFAULT 60,
  notes TEXT,                     -- coaching cues
  sort_order INT NOT NULL,
  superset_group INT             -- null = standalone, same number = superset together
);

-- Actual workout sessions (when user goes to gym)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  started_at TIMESTAMPTZ NOT NULL,  -- user inputs this
  ended_at TIMESTAMPTZ,
  notes TEXT,
  mood_rating INT,                  -- 1-5
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual exercise logs within a session
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  template_exercise_id UUID REFERENCES template_exercises(id),
  set_number INT NOT NULL,
  reps_completed INT,
  weight_used DECIMAL(6,2),       -- in lbs
  weight_unit TEXT DEFAULT 'lbs', -- 'lbs' or 'kg'
  duration_seconds INT,           -- for holds like planks
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Weight check-ins (weekly weigh-ins)
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user can only access own data)
CREATE POLICY "Users own profiles" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own programs" ON programs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own templates" ON workout_templates
  FOR ALL USING (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users access own template exercises" ON template_exercises
  FOR ALL USING (
    template_id IN (
      SELECT wt.id FROM workout_templates wt
      JOIN programs p ON wt.program_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users own sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own exercise logs" ON exercise_logs
  FOR ALL USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own weight logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- Exercises are readable by all authenticated users
CREATE POLICY "Exercises are readable" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Research-Backed Exercise Programming

The previous plan repeated the same machines every week. Here's a properly periodized 4-week program based on exercise science principles:

**Week 1-2: Anatomical Adaptation (3×12, 60s rest)**
Focus on machine-based movements to build motor patterns and connective tissue tolerance.

**Week 3: Hypertrophy Transition (3-4×10, 60-90s rest)**
Introduce cable and free-weight variations. Increase volume.

**Week 4: Strength Test (4×8, 90s rest)**
Heavier loads, lower reps, compound focus.

#### Monday — Push Day

| Week | Exercise 1 | Exercise 2 | Exercise 3 | Exercise 4 | Exercise 5 | Exercise 6 |
|------|-----------|-----------|-----------|-----------|-----------|-----------|
| W1 | Chest Press Machine (3×12) | Incline Chest Press Machine (3×12) | Shoulder Press Machine (3×10) | Tricep Pushdown Cable (3×12) | Plank (3×20s) | — |
| W2 | Chest Press Machine (3×12 +10lbs) | Incline Chest Press Machine (3×12 +5lbs) | Shoulder Press Machine (3×10 +5lbs) | Lateral Raise Machine (3×12) | Tricep Pushdown Cable (3×12 +5lbs) | Plank (3×30s) |
| W3 | Dumbbell Bench Press (4×10) | Cable Crossover (3×12) | Dumbbell Shoulder Press (3×10) | Lateral Raise Machine (3×12) | Tricep Rope Pushdown (3×12) | Plank (3×35s) |
| W4 | Chest Press Machine (4×8 heavy) | Incline Dumbbell Press (3×8) | Shoulder Press Machine (3×8 heavy) | Arnold Press Dumbbell (3×10) | Tricep Pushdown (3×10 heavy) | Plank (3×45s) |

#### Tuesday — Pull Day

| Week | Exercise 1 | Exercise 2 | Exercise 3 | Exercise 4 | Exercise 5 |
|------|-----------|-----------|-----------|-----------|-----------|
| W1 | Seated Row Machine (3×12) | Lat Pulldown (3×12) | Cable Face Pull (3×15) | Bicep Curl Machine (3×12) | Plank (3×20s) |
| W2 | Seated Row Machine (3×12 +10lbs) | Lat Pulldown (3×12 +5lbs) | Cable Face Pull (3×15 +5lbs) | Bicep Curl Machine (3×12 +5lbs) | Reverse Fly Machine (3×12) |
| W3 | Cable Row (4×10) | Wide-Grip Lat Pulldown (4×10) | Cable Face Pull (3×15) | Dumbbell Hammer Curl (3×10) | Reverse Fly Machine (3×12) |
| W4 | Seated Row Machine (4×8 heavy) | Close-Grip Lat Pulldown (4×8) | Cable Face Pull (3×15) | Bicep Curl Machine (3×10 heavy) | Reverse Fly Machine (3×12) |

#### Wednesday — Upper Body (Compound Focus)

| Week | Exercise 1 | Exercise 2 | Exercise 3 | Exercise 4 | Exercise 5 |
|------|-----------|-----------|-----------|-----------|-----------|
| W1 | Chest Press (3×12) | Seated Row (3×12) | Shoulder Press (3×10) | Lat Pulldown (3×10) | Plank (3×25s) |
| W2 | Chest Press (3×12) | Seated Row (3×12) | Shoulder Press (3×10) | Lat Pulldown (3×10) | Tricep/Bicep superset (3×12) |
| W3 | Dumbbell Bench (3×10) | Cable Row (3×10) | Dumbbell Shoulder Press (3×10) | Lat Pulldown (3×10) | Tricep/Bicep superset (3×10) |
| W4 | Machine Chest Press (4×8) | Machine Row (4×8) | Machine Shoulder Press (3×8) | Lat Pulldown (3×8) | Plank (3×45s) |

#### Thursday — Shoulders & Arms (Isolation Focus)

| Week | Exercise 1 | Exercise 2 | Exercise 3 | Exercise 4 | Exercise 5 |
|------|-----------|-----------|-----------|-----------|-----------|
| W1 | Shoulder Press Machine (3×10) | Lateral Raise Machine (3×12) | Face Pull (3×15) | Bicep Curl Machine (3×12) | Tricep Pushdown (3×12) |
| W2 | Shoulder Press Machine (3×10) | Lateral Raise Machine (3×12) | Face Pull (3×15) | Preacher Curl Machine (3×12) | Tricep Dip Machine (3×12) |
| W3 | Dumbbell Shoulder Press (4×10) | Cable Lateral Raise (3×12) | Face Pull (3×15) | Incline Dumbbell Curl (3×10) | Cable Tricep Overhead Ext (3×12) |
| W4 | Shoulder Press Machine (4×8) | Lateral Raise Machine (3×12) | Face Pull (3×15) | EZ Bar Curl (4×10) | Tricep Pushdown (4×10) |

#### Friday — Leg Day

| Week | Exercise 1 | Exercise 2 | Exercise 3 | Exercise 4 | Exercise 5 | Exercise 6 |
|------|-----------|-----------|-----------|-----------|-----------|-----------|
| W1 | Leg Press (3×12) | Leg Extension (3×12) | Leg Curl (3×12) | Calf Raises (3×15) | Plank (3×25s) | — |
| W2 | Leg Press (3×12 +15lbs) | Leg Extension (3×12) | Leg Curl (3×12) | Hip Adductor (3×12) | Calf Raises (3×15) | Plank (3×35s) |
| W3 | Leg Press (4×10) | Goblet Squat (3×10) | Leg Curl (3×12) | Leg Extension (3×12) | Hip Adductor (3×12) | Plank (3×40s) |
| W4 | Leg Press (4×8 heavy) | Leg Extension (3×10) | Leg Curl (3×10) | Hip Adductor (3×12) | Calf Raises (3×20) | Plank (3×45s) |

#### Sunday — Active Recovery (Pushup Pyramid)

| Week | Pyramid | Total Reps |
|------|---------|-----------|
| W1 | 5 → 10 → 15 → 10 → 5 | 45 |
| W2 | 10 → 15 → 20 → 15 → 10 | 70 |
| W3 | 10 → 15 → 20 → 15 → 10 | 70 |
| W4 | 15 → 20 → 25 → 20 → 15 | 95 |

**Key principle:** Exercises CHANGE across weeks. Week 1-2 uses machines for safety. Week 3 introduces cables and dumbbells. Week 4 tests strength on the original machines with heavier loads to measure progress.

### Pages & Components

```
/gym
├── /dashboard          → Weekly overview, progress rings, weight chart
├── /workout            → Today's workout (auto-detects day)
│   ├── StartSession    → Input gym start time, shows adjusted timeline
│   ├── ExerciseCard    → Sets/reps/weight with completion checkboxes
│   ├── RestTimer       → Countdown between sets
│   └── SessionSummary  → Post-workout stats
├── /history            → Past sessions calendar view
├── /progress           → Weight progression charts per exercise
└── /settings           → Profile, gym time, weight goal
```

### API Routes

```
POST   /api/gym/sessions          → Start a new workout session
PATCH  /api/gym/sessions/:id      → End session, add notes
POST   /api/gym/exercises/log     → Log a set completion
GET    /api/gym/progress          → Get exercise weight history
POST   /api/gym/weight            → Log a weigh-in
GET    /api/gym/today              → Get today's planned workout
```

---

## Phase 2: Meal Logger + Supplement Guide

### Features
- Log meals with food items, quantities
- Auto-calculate calories, protein, carbs, fats, key vitamins
- Daily macro dashboard with targets vs actual
- Pre/post workout meal timing based on gym start time
- Supplement protocol with recommended products
- Indian vegetarian food database

### Database Schema (Additional Tables)

```sql
-- Food items database (Indian vegetarian focus)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "Paneer"
  serving_size DECIMAL(8,2) NOT NULL,  -- 100
  serving_unit TEXT NOT NULL,          -- "g"
  calories DECIMAL(8,2),
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fiber_g DECIMAL(6,2),
  calcium_mg DECIMAL(8,2),
  iron_mg DECIMAL(6,2),
  vitamin_b12_mcg DECIMAL(6,2),
  vitamin_d_iu DECIMAL(8,2),
  zinc_mg DECIMAL(6,2),
  category TEXT,                       -- 'dairy', 'legume', 'grain', 'vegetable', 'fruit', 'supplement'
  is_supplement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meal logs
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,             -- 'breakfast', 'pre_workout', 'post_workout', 'lunch', 'snack', 'dinner', 'gainer'
  logged_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Food items within a meal
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  custom_name TEXT,                    -- if food not in DB
  quantity DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL,                  -- "g", "ml", "piece", "cup", "tbsp"
  calories DECIMAL(8,2),              -- calculated or manual
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2)
);

-- Daily nutrition targets
CREATE TABLE nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calories_target INT DEFAULT 3200,
  protein_g_target INT DEFAULT 150,
  carbs_g_target INT DEFAULT 400,
  fat_g_target INT DEFAULT 90,
  is_active BOOLEAN DEFAULT true
);

-- Supplement schedule
CREATE TABLE supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  supplement_name TEXT NOT NULL,       -- 'creatine', 'whey', 'gainer'
  dose TEXT,
  taken_at TIMESTAMPTZ DEFAULT now(),
  with_meal_id UUID REFERENCES meal_logs(id)
);

-- RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Foods readable by all" ON foods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users own meal logs" ON meal_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own meal items" ON meal_items
  FOR ALL USING (
    meal_log_id IN (SELECT id FROM meal_logs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own nutrition targets" ON nutrition_targets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own supplement logs" ON supplement_logs
  FOR ALL USING (auth.uid() = user_id);
```

### Supplement Recommendations Section

Dedicated page `/gym/supplements` with product recommendations:

| Supplement | Recommended Brand | Why | Dose | Timing |
|-----------|------------------|-----|------|--------|
| Creatine Monohydrate | MuscleBlaze Creatine Monohydrate / Optimum Nutrition Micronized | Most researched supplement. Monohydrate is the only proven form. Skip HCL, ethyl ester. | 5g/day | With breakfast, daily |
| Whey Protein | MuscleBlaze Biozyme / Optimum Nutrition Gold Standard | Look for >24g protein per scoop, low sugar. Biozyme has digestive enzymes. | 1 scoop (~30g protein) | Post-workout or between meals on rest days |
| Mass Gainer | MuscleBlaze Super Gainer XXL / Serious Mass | 800-1000 cal/serving. Choose one with <40g sugar. Mix with milk. | 1 serving | ~3:30 PM (2 hrs before gym) |
| Multivitamin | MuscleBlaze MB-Vite / HealthKart HK Vitals | Vegetarians often lack B12, D3, Iron, Zinc. Cover the gaps. | 1 tablet | With breakfast |
| Omega-3 (Optional) | HealthKart Fish Oil / Flaxseed Oil (veg) | Joint health, inflammation reduction. Flaxseed if strict veg. | 1000mg | With any meal |

### Meal Timing (Based on 5:30-6:30 PM Gym)

```
  8:00 AM  ── Breakfast + Creatine + Multivitamin
  1:00 PM  ── Lunch
  3:30 PM  ── Gainer Shake (2 hrs before gym)
  5:00 PM  ── Pre-workout (banana + coffee)
  5:30 PM  ── GYM START ←── user inputs this
  6:30 PM  ── GYM END
  6:45 PM  ── Whey Shake (within 30 min)
  8:30 PM  ── Dinner
```

If gym time changes, all other times shift proportionally.

### Pages & Components

```
/gym/meals
├── /today              → Today's meal timeline with logging
├── /log                → Quick-add meal with food search
├── /supplements        → Supplement protocol + product recs
├── /history            → Past nutrition data
└── /stats              → Weekly/monthly macro averages
```

### API Routes

```
POST   /api/gym/meals               → Log a meal
POST   /api/gym/meals/:id/items     → Add food items to meal
GET    /api/gym/meals/today          → Get today's meals + totals
GET    /api/gym/foods/search?q=      → Search food database
POST   /api/gym/supplements/log     → Log supplement intake
GET    /api/gym/nutrition/daily      → Daily macro summary
GET    /api/gym/nutrition/weekly     → Weekly averages
```

---

## Phase 3: AI Coach (Ollama Cloud API)

### Features
- Smart plan generation based on user progress data
- Chatbot for exercise form questions, meal suggestions, plateau advice
- Automatic program adjustment based on completion data and weight trends
- Exercise substitution suggestions

### Architecture

```
User Chat Input
      │
      ▼
/api/gym/ai/chat  ──→  Build context from Supabase
      │                 (recent sessions, weight trend,
      │                  nutrition gaps, completion %)
      ▼
  Ollama Cloud API
  (with system prompt + user context)
      │
      ▼
  Structured Response
  (advice, plan changes, substitutions)
```

### System Prompt Template

```
You are a fitness coach for a vegetarian male, currently {weight}kg,
targeting {target}kg. Their supplement stack: creatine, whey, gainer.

Current week: {week_number} of program "{program_name}".
Completion rate this week: {completion_pct}%.
Weight trend: {trend} ({delta}kg over last {n} weeks).
Nutrition average: {avg_cal} cal/day, {avg_protein}g protein.

Recent struggles: {missed_exercises}.
Recent PRs: {recent_prs}.

Respond as a knowledgeable but direct coach. Give actionable advice.
```

### API Routes

```
POST   /api/gym/ai/chat             → Send message, get response
POST   /api/gym/ai/generate-plan    → Generate next month's plan
GET    /api/gym/ai/suggestions      → Daily tips based on data
POST   /api/gym/ai/substitute       → Get exercise alternative
```

### Database (Additional)

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);
```

---

## Phase 4: Dynamic Exercise Programming

### Features
- Auto-generate next month's program based on progress
- Exercise rotation to prevent plateaus
- Periodization (strength, hypertrophy, endurance cycles)
- Deload week detection
- Exercise substitution if equipment unavailable

### Logic

```
IF completion_rate > 90% AND all_weights_progressed:
  → Next month: increase intensity (heavier loads, lower reps)
  → Introduce 1-2 new exercises per muscle group

IF completion_rate < 70%:
  → Next month: reduce volume, keep same weights
  → Flag potential recovery issues

IF weight_stalled for 2+ weeks:
  → Increase daily calories by 200
  → Suggest gainer timing adjustment

IF specific_exercise_stalled for 2+ weeks:
  → Suggest variation (e.g., machine → dumbbell)
  → Adjust rep scheme
```

---

## UI Theme System

```css
/* Black & Electric Blue */
:root {
  --bg-primary: #000000;
  --bg-card: #0A0A0A;
  --bg-elevated: #111111;
  --text-primary: #E8E8E8;
  --text-muted: #555555;
  --border: #1A1A1A;
  --accent: #00AAFF;
  --accent-hover: #0088CC;
  --accent-subtle: rgba(0, 170, 255, 0.08);
  --success: #00CC88;
  --warning: #FFAA00;
  --error: #FF4444;
}

/* Light mode override */
[data-theme="light"] {
  --bg-primary: #F0F7FF;
  --bg-card: #FFFFFF;
  --bg-elevated: #E8F0FA;
  --text-primary: #0A0A0A;
  --text-muted: #6B7B94;
  --border: #C8D8EC;
  --accent: #0066CC;
  --accent-hover: #004499;
  --accent-subtle: rgba(0, 102, 204, 0.06);
}
```

---

## File Structure (within existing project)

```
src/
├── app/
│   ├── gym/
│   │   ├── page.tsx                  → Dashboard
│   │   ├── layout.tsx                → Gym app shell + nav
│   │   ├── workout/
│   │   │   ├── page.tsx              → Today's workout
│   │   │   └── [sessionId]/page.tsx  → Active session
│   │   ├── meals/
│   │   │   ├── page.tsx              → Today's meals
│   │   │   └── log/page.tsx          → Meal logger
│   │   ├── supplements/page.tsx      → Supplement guide
│   │   ├── progress/page.tsx         → Charts + weight
│   │   ├── ai/page.tsx               → AI Coach chat
│   │   └── settings/page.tsx         → Profile + prefs
│   └── api/gym/
│       ├── sessions/route.ts
│       ├── exercises/route.ts
│       ├── meals/route.ts
│       ├── foods/route.ts
│       ├── supplements/route.ts
│       ├── nutrition/route.ts
│       ├── weight/route.ts
│       └── ai/
│           ├── chat/route.ts
│           └── generate-plan/route.ts
├── components/gym/
│   ├── ExerciseCard.tsx
│   ├── SetLogger.tsx
│   ├── RestTimer.tsx
│   ├── MealCard.tsx
│   ├── MacroRing.tsx
│   ├── WeightChart.tsx
│   ├── ProgressBar.tsx
│   ├── SupplementCard.tsx
│   ├── SessionTimer.tsx
│   └── FoodSearch.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                  → Generated DB types
│   ├── gym/
│   │   ├── program-generator.ts      → Dynamic plan creation
│   │   ├── macro-calculator.ts       → Nutrition math
│   │   └── timeline-adjuster.ts      → Shift meals by gym time
│   └── ollama/
│       └── client.ts                 → Ollama API wrapper
└── data/
    ├── exercises-seed.json           → Exercise library
    └── foods-seed.json               → Indian veg food DB
```

---

## Build Order & Effort Estimates

| Phase | What | Effort | Depends On |
|-------|------|--------|-----------|
| **1a** | Supabase schema + auth + RLS | 2-3 hrs | Nothing |
| **1b** | Exercise seed data (library of ~60 exercises) | 1-2 hrs | 1a |
| **1c** | Workout dashboard + today's workout page | 4-5 hrs | 1a, 1b |
| **1d** | Session timer + exercise completion logging | 3-4 hrs | 1c |
| **1e** | Progress page + weight chart | 2-3 hrs | 1d |
| **2a** | Food database seed (~100 Indian veg items) | 2-3 hrs | 1a |
| **2b** | Meal logger UI + food search | 4-5 hrs | 2a |
| **2c** | Daily nutrition dashboard | 3-4 hrs | 2b |
| **2d** | Supplement guide page | 1-2 hrs | Nothing |
| **2e** | Timeline adjuster (gym time → meal timing) | 2-3 hrs | 2c |
| **3a** | Ollama API integration | 2-3 hrs | Nothing |
| **3b** | AI chatbot UI | 3-4 hrs | 3a |
| **3c** | Context builder (feed user data to AI) | 3-4 hrs | 3a, 1d, 2c |
| **4a** | Program generator logic | 4-5 hrs | 1d, 3a |
| **4b** | Exercise substitution engine | 2-3 hrs | 4a |

**Total: ~40-50 hours across all 4 phases.**

---

## What's Missing From Current JSX (Issues to Fix)

1. **Meal times out of order** — gainer at 3:30 PM was sometimes listed after pre-workout at 5 PM
2. **Same exercises every week** — no exercise variation across weeks, same machines repeated
3. **No actual data persistence** — checkboxes reset on page reload
4. **No gym timer** — no way to input start time and track session duration
5. **No macro input** — no way to log what you actually ate vs what was planned
6. **No supplement product recommendations** — just names, no brands/buying guide
7. **No weight tracking** — no weigh-in logging or progress chart
8. **No progressive overload tracking** — can't see weight history per exercise

---

## Next Step

Ready to start Phase 1a? I'll generate the full Supabase migration SQL and auth setup. Tell me which existing project this goes into and I'll structure it accordingly.
