-- ============================================================================
-- HyperRep Initial Schema Migration
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- profiles: extends auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  current_weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2) DEFAULT 80.0,
  gym_start_time TIME DEFAULT '17:30',
  preferred_weight_unit TEXT DEFAULT 'lbs' CHECK (preferred_weight_unit IN ('lbs', 'kg')),
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- exercises: master exercise library
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

-- programs: workout programs
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

-- workout_templates: planned workouts per day (denormalized user_id)
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

-- template_exercises: exercises within a template (denormalized user_id)
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

-- workout_sessions: actual gym sessions
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

-- exercise_logs: individual set logs (denormalized user_id)
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
  notes TEXT
);

-- weight_logs: body weight check-ins
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  UNIQUE(user_id, logged_at)
);

-- ============================================================================
-- 2. TRIGGERS
-- ============================================================================

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- profiles: users can only access their own profile
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL USING ((select auth.uid()) = id);

-- exercises: any authenticated user can read the exercise library
CREATE POLICY "exercises_select_policy" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- programs: users can only access their own programs
CREATE POLICY "programs_policy" ON programs
  FOR ALL USING ((select auth.uid()) = user_id);

-- workout_templates: users can only access their own templates
CREATE POLICY "workout_templates_policy" ON workout_templates
  FOR ALL USING ((select auth.uid()) = user_id);

-- template_exercises: users can only access their own template exercises
CREATE POLICY "template_exercises_policy" ON template_exercises
  FOR ALL USING ((select auth.uid()) = user_id);

-- workout_sessions: users can only access their own sessions
CREATE POLICY "workout_sessions_policy" ON workout_sessions
  FOR ALL USING ((select auth.uid()) = user_id);

-- exercise_logs: users can only access their own logs
CREATE POLICY "exercise_logs_policy" ON exercise_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- weight_logs: users can only access their own weight logs
CREATE POLICY "weight_logs_policy" ON weight_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- exercises
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

-- programs
CREATE INDEX idx_programs_user_id ON programs(user_id);

-- workout_templates
CREATE INDEX idx_workout_templates_program_id ON workout_templates(program_id);
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id);

-- template_exercises
CREATE INDEX idx_template_exercises_template_id ON template_exercises(template_id);
CREATE INDEX idx_template_exercises_exercise_id ON template_exercises(exercise_id);
CREATE INDEX idx_template_exercises_user_id ON template_exercises(user_id);

-- workout_sessions
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_template_id ON workout_sessions(template_id);
CREATE INDEX idx_workout_sessions_program_id ON workout_sessions(program_id);

-- exercise_logs
CREATE INDEX idx_exercise_logs_session_id ON exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise_id ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_user_id ON exercise_logs(user_id);

-- weight_logs
CREATE INDEX idx_weight_logs_user_id ON weight_logs(user_id);
