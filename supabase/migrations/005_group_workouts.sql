-- ============================================================================
-- HyperRep Group Workouts Migration
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- workout_groups: groups of people working out together
CREATE TABLE workout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  max_members INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- group_members: membership + roles
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

-- group_shared_plans: what the manager shares with the group
CREATE TABLE group_shared_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
  source_program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'full' CHECK (share_type IN ('full', 'range')),
  day_start INT,
  day_end INT,
  week_start INT,
  week_end INT,
  include_meals BOOLEAN DEFAULT false,
  include_timeline BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- group_messages: chat within a group
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- group_invitations: email invites for users who may not have signed up yet
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  UNIQUE(group_id, invited_email)
);

-- ============================================================================
-- 2. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on workout_groups
CREATE TRIGGER on_workout_groups_updated
  BEFORE UPDATE ON workout_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-update updated_at on group_shared_plans
CREATE TRIGGER on_group_shared_plans_updated
  BEFORE UPDATE ON group_shared_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_shared_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- workout_groups: members can read their groups, creator can manage
CREATE POLICY "workout_groups_select" ON workout_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND status IN ('pending', 'accepted'))
  );

CREATE POLICY "workout_groups_insert" ON workout_groups
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "workout_groups_update" ON workout_groups
  FOR UPDATE USING ((select auth.uid()) = created_by);

CREATE POLICY "workout_groups_delete" ON workout_groups
  FOR DELETE USING ((select auth.uid()) = created_by);

-- group_members: can see members in your groups
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members gm WHERE gm.user_id = (select auth.uid()) AND gm.status IN ('pending', 'accepted'))
  );

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    -- Manager of the group can invite
    group_id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND role = 'manager' AND status = 'accepted')
    OR
    -- Or it's the creator adding themselves as manager
    user_id = (select auth.uid())
  );

CREATE POLICY "group_members_update" ON group_members
  FOR UPDATE USING (
    -- User can update their own membership (accept/decline)
    user_id = (select auth.uid())
    OR
    -- Manager can update members in their groups
    group_id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND role = 'manager' AND status = 'accepted')
  );

-- group_shared_plans: members can read, manager can manage
CREATE POLICY "group_shared_plans_select" ON group_shared_plans
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND status = 'accepted')
  );

CREATE POLICY "group_shared_plans_manage" ON group_shared_plans
  FOR ALL USING ((select auth.uid()) = shared_by);

-- group_messages: only accepted members can read and write
CREATE POLICY "group_messages_select" ON group_messages
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND status = 'accepted')
  );

CREATE POLICY "group_messages_insert" ON group_messages
  FOR INSERT WITH CHECK (
    (select auth.uid()) = sender_id
    AND group_id IN (SELECT group_id FROM group_members WHERE user_id = (select auth.uid()) AND status = 'accepted')
  );

-- group_invitations: creator can manage, invited user can see
CREATE POLICY "group_invitations_manage" ON group_invitations
  FOR ALL USING ((select auth.uid()) = invited_by);

-- CRITICAL: Allow group members to READ shared workout templates
CREATE POLICY "shared_templates_read" ON workout_templates
  FOR SELECT USING (
    program_id IN (
      SELECT gsp.source_program_id FROM group_shared_plans gsp
      JOIN group_members gm ON gm.group_id = gsp.group_id
      WHERE gm.user_id = (select auth.uid()) AND gm.status = 'accepted' AND gsp.is_active = true
    )
  );

-- Allow group members to READ shared template exercises
CREATE POLICY "shared_template_exercises_read" ON template_exercises
  FOR SELECT USING (
    template_id IN (
      SELECT wt.id FROM workout_templates wt
      JOIN group_shared_plans gsp ON gsp.source_program_id = wt.program_id
      JOIN group_members gm ON gm.group_id = gsp.group_id
      WHERE gm.user_id = (select auth.uid()) AND gm.status = 'accepted' AND gsp.is_active = true
    )
  );

-- Allow group members to READ shared program info
CREATE POLICY "shared_programs_read" ON programs
  FOR SELECT USING (
    id IN (
      SELECT gsp.source_program_id FROM group_shared_plans gsp
      JOIN group_members gm ON gm.group_id = gsp.group_id
      WHERE gm.user_id = (select auth.uid()) AND gm.status = 'accepted' AND gsp.is_active = true
    )
  );

-- Allow reading profile names of group members (for chat and member list)
CREATE POLICY "group_member_profiles_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm2.group_id = gm1.group_id
      WHERE gm1.user_id = (select auth.uid()) AND gm1.status = 'accepted'
    )
  );

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_status ON group_members(user_id, status);
CREATE INDEX idx_shared_plans_group ON group_shared_plans(group_id);
CREATE INDEX idx_shared_plans_program ON group_shared_plans(source_program_id);
CREATE INDEX idx_group_messages_group ON group_messages(group_id, created_at);
CREATE INDEX idx_group_invitations_email ON group_invitations(invited_email);
CREATE INDEX idx_workout_groups_invite_code ON workout_groups(invite_code);

-- ============================================================================
-- 5. REALTIME
-- ============================================================================

-- Enable realtime for group messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
