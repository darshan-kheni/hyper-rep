-- ============================================================================
-- Fix: infinite recursion in group_members RLS policies
-- Solution: SECURITY DEFINER function that bypasses RLS
-- ============================================================================

-- Helper function: get group IDs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_group_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM group_members
  WHERE user_id = uid AND status IN ('pending', 'accepted');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get accepted group IDs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_accepted_group_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM group_members
  WHERE user_id = uid AND status = 'accepted';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is manager of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_manager(uid UUID, gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE user_id = uid AND group_id = gid AND role = 'manager' AND status = 'accepted'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Drop and recreate all policies that caused recursion
-- ============================================================================

-- workout_groups: creator can always see + members
DROP POLICY IF EXISTS "workout_groups_select" ON workout_groups;
CREATE POLICY "workout_groups_select" ON workout_groups
  FOR SELECT USING (
    (select auth.uid()) = created_by
    OR id IN (SELECT public.get_user_group_ids((select auth.uid())))
  );

-- group_members: the main culprit
DROP POLICY IF EXISTS "group_members_select" ON group_members;
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT public.get_user_group_ids((select auth.uid())))
  );

DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    public.is_group_manager((select auth.uid()), group_id)
    OR user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "group_members_update" ON group_members;
CREATE POLICY "group_members_update" ON group_members
  FOR UPDATE USING (
    user_id = (select auth.uid())
    OR public.is_group_manager((select auth.uid()), group_id)
  );

-- group_shared_plans
DROP POLICY IF EXISTS "group_shared_plans_select" ON group_shared_plans;
CREATE POLICY "group_shared_plans_select" ON group_shared_plans
  FOR SELECT USING (
    group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
  );

-- group_messages
DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
CREATE POLICY "group_messages_select" ON group_messages
  FOR SELECT USING (
    group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
  );

DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;
CREATE POLICY "group_messages_insert" ON group_messages
  FOR INSERT WITH CHECK (
    (select auth.uid()) = sender_id
    AND group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
  );

-- shared program/template/exercise read policies
DROP POLICY IF EXISTS "shared_programs_read" ON programs;
CREATE POLICY "shared_programs_read" ON programs
  FOR SELECT USING (
    id IN (
      SELECT gsp.source_program_id FROM group_shared_plans gsp
      WHERE gsp.group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
        AND gsp.is_active = true
    )
  );

DROP POLICY IF EXISTS "shared_templates_read" ON workout_templates;
CREATE POLICY "shared_templates_read" ON workout_templates
  FOR SELECT USING (
    program_id IN (
      SELECT gsp.source_program_id FROM group_shared_plans gsp
      WHERE gsp.group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
        AND gsp.is_active = true
    )
  );

DROP POLICY IF EXISTS "shared_template_exercises_read" ON template_exercises;
CREATE POLICY "shared_template_exercises_read" ON template_exercises
  FOR SELECT USING (
    template_id IN (
      SELECT wt.id FROM workout_templates wt
      JOIN group_shared_plans gsp ON gsp.source_program_id = wt.program_id
      WHERE gsp.group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
        AND gsp.is_active = true
    )
  );

-- Profile read for group members
DROP POLICY IF EXISTS "group_member_profiles_read" ON profiles;
CREATE POLICY "group_member_profiles_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (SELECT public.get_user_accepted_group_ids((select auth.uid())))
    )
  );
