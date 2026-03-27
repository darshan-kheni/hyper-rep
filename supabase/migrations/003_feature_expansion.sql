-- ============================================
-- HYPERREP: Feature Expansion Migration
-- Fix name trigger, rest day, AI, locking
-- ============================================

-- 1. Fix handle_new_user trigger to save name from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Customizable rest day (1=Mon ... 7=Sun, default 6=Saturday)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rest_day INT DEFAULT 6;

-- 3. AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own ai conversations" ON ai_conversations
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Exercise checkmark locking
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
