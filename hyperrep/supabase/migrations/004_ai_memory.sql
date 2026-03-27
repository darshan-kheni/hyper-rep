-- ============================================
-- HYPERREP: AI Memory System
-- Persistent per-user AI context and learnings
-- ============================================

-- AI memories — key facts the AI learns about each user
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,  -- 'goal', 'preference', 'struggle', 'pattern', 'health', 'lifestyle', 'nutrition', 'motivation'
  content TEXT NOT NULL,   -- the actual memory/fact
  source TEXT,             -- which conversation or action created this
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own ai memories" ON ai_memories
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_category ON ai_memories(user_id, category);

CREATE TRIGGER ai_memories_updated_at
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
