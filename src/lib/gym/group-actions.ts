"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Auth helper ──
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Create a workout group ──
export async function createGroup(name: string, description?: string) {
  const { supabase, user } = await getUser();

  const { data: group, error } = await supabase
    .from("workout_groups")
    .insert({
      name,
      description: description || null,
      created_by: user.id,
    })
    .select("id, invite_code")
    .single();

  if (error || !group) throw new Error(`Failed to create group: ${error?.message || "no data"}`);

  // Add creator as manager
  const { error: memberErr } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "manager",
    status: "accepted",
    invited_by: user.id,
    accepted_at: new Date().toISOString(),
  });

  if (memberErr) throw new Error(`Failed to add as manager: ${memberErr.message}`);

  revalidatePath("/gym/groups");
  return group;
}

// ── Get my groups ──
export async function getMyGroups() {
  const { supabase, user } = await getUser();

  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      id,
      role,
      status,
      workout_groups (
        id,
        name,
        description,
        invite_code,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["accepted", "pending"])
    .order("invited_at", { ascending: false });

  return memberships || [];
}

// ── Get group details ──
export async function getGroupDetails(groupId: string) {
  const { supabase, user } = await getUser();

  // Verify membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "accepted") {
    throw new Error("Not a member of this group");
  }

  const [{ data: group }, { data: members }, { data: sharedPlans }] =
    await Promise.all([
      supabase
        .from("workout_groups")
        .select("*")
        .eq("id", groupId)
        .single(),
      supabase
        .from("group_members")
        .select(`
          id,
          user_id,
          role,
          status,
          accepted_at,
          profiles (name)
        `)
        .eq("group_id", groupId)
        .in("status", ["accepted", "pending"])
        .order("role", { ascending: true }),
      supabase
        .from("group_shared_plans")
        .select(`
          id,
          source_program_id,
          shared_by,
          share_type,
          day_start,
          day_end,
          week_start,
          week_end,
          include_meals,
          include_timeline,
          is_active,
          programs (name)
        `)
        .eq("group_id", groupId)
        .eq("is_active", true),
    ]);

  return {
    group,
    members: members || [],
    sharedPlans: sharedPlans || [],
    myRole: membership.role,
    userId: user.id,
  };
}

// ── Invite a member by email ──
export async function inviteMember(groupId: string, email: string) {
  const { supabase, user } = await getUser();

  // Verify manager role
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!membership || membership.role !== "manager") {
    throw new Error("Only the manager can invite members");
  }

  // Check member count
  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .in("status", ["accepted", "pending"]);

  const { data: group } = await supabase
    .from("workout_groups")
    .select("max_members")
    .eq("id", groupId)
    .single();

  if ((count || 0) >= (group?.max_members || 4)) {
    throw new Error("Group is full");
  }

  // Store as email invitation — on the invited user's next login,
  // the groups page will check for pending email invitations and convert them.
  // For now also try to find the user in profiles by checking auth metadata
  // We can't use admin API with anon key, so use email invitation flow
  const { error } = await supabase.from("group_invitations").insert({
    group_id: groupId,
    invited_email: email.toLowerCase().trim(),
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") throw new Error("Already invited");
    throw new Error("Failed to send invitation");
  }

  revalidatePath(`/gym/groups/${groupId}`);
}

// ── Respond to invitation ──
export async function respondToInvitation(
  membershipId: string,
  accept: boolean
) {
  const { supabase, user } = await getUser();

  const updateData = accept
    ? { status: "accepted" as const, accepted_at: new Date().toISOString() }
    : { status: "declined" as const };

  const { error } = await supabase
    .from("group_members")
    .update(updateData)
    .eq("id", membershipId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) throw new Error("Failed to respond to invitation");

  revalidatePath("/gym/groups");
}

// ── Join group via invite code ──
export async function joinGroupByCode(inviteCode: string) {
  const { supabase, user } = await getUser();

  const { data: group } = await supabase
    .from("workout_groups")
    .select("id, max_members")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) throw new Error("Invalid invite code");

  // Check not already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.status === "accepted") throw new Error("Already a member");
    if (existing.status === "pending") throw new Error("Invitation already pending");
    // If declined/removed, allow re-join
    await supabase
      .from("group_members")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // Check member count
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id)
      .in("status", ["accepted", "pending"]);

    if ((count || 0) >= (group.max_members || 4)) {
      throw new Error("Group is full");
    }

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "member",
      status: "accepted",
      invited_by: user.id,
      accepted_at: new Date().toISOString(),
    });
  }

  revalidatePath("/gym/groups");
  return group.id;
}

// ── Share plan with group ──
export async function sharePlan(
  groupId: string,
  shareType: "full" | "range",
  options?: {
    dayStart?: number;
    dayEnd?: number;
    weekStart?: number;
    weekEnd?: number;
    includeMeals?: boolean;
    includeTimeline?: boolean;
  }
) {
  const { supabase, user } = await getUser();

  // Get user's active program
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!program) throw new Error("No active program to share");

  // Deactivate any existing shared plans from this user in this group
  await supabase
    .from("group_shared_plans")
    .update({ is_active: false })
    .eq("group_id", groupId)
    .eq("shared_by", user.id);

  const { error } = await supabase.from("group_shared_plans").insert({
    group_id: groupId,
    source_program_id: program.id,
    shared_by: user.id,
    share_type: shareType,
    day_start: options?.dayStart || null,
    day_end: options?.dayEnd || null,
    week_start: options?.weekStart || null,
    week_end: options?.weekEnd || null,
    include_meals: options?.includeMeals || false,
    include_timeline: options?.includeTimeline || false,
  });

  if (error) throw new Error("Failed to share plan");

  revalidatePath(`/gym/groups/${groupId}`);
  revalidatePath("/gym/groups");
}

// ── Update sharing settings ──
export async function updateSharingSettings(
  sharedPlanId: string,
  settings: {
    shareType?: "full" | "range";
    dayStart?: number | null;
    dayEnd?: number | null;
    weekStart?: number | null;
    weekEnd?: number | null;
    includeMeals?: boolean;
    includeTimeline?: boolean;
  }
) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("group_shared_plans")
    .update({
      share_type: settings.shareType,
      day_start: settings.dayStart,
      day_end: settings.dayEnd,
      week_start: settings.weekStart,
      week_end: settings.weekEnd,
      include_meals: settings.includeMeals,
      include_timeline: settings.includeTimeline,
    })
    .eq("id", sharedPlanId)
    .eq("shared_by", user.id);

  if (error) throw new Error("Failed to update sharing settings");

  revalidatePath("/gym/groups");
}

// ── Stop sharing plan ──
export async function stopSharing(sharedPlanId: string) {
  const { supabase, user } = await getUser();

  await supabase
    .from("group_shared_plans")
    .update({ is_active: false })
    .eq("id", sharedPlanId)
    .eq("shared_by", user.id);

  revalidatePath("/gym/groups");
}

// ── Remove a member (manager only) ──
export async function removeMember(groupId: string, targetUserId: string) {
  const { supabase, user } = await getUser();

  // Verify manager
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!membership || membership.role !== "manager") {
    throw new Error("Only the manager can remove members");
  }

  // Can't remove yourself
  if (targetUserId === user.id) {
    throw new Error("Cannot remove yourself. Delete the group instead.");
  }

  await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  revalidatePath(`/gym/groups/${groupId}`);
}

// ── Leave group ──
export async function leaveGroup(groupId: string) {
  const { supabase, user } = await getUser();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role === "manager") {
    throw new Error("Managers cannot leave. Delete the group instead.");
  }

  await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath("/gym/groups");
}

// ── Delete group (manager only) ──
export async function deleteGroup(groupId: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("workout_groups")
    .delete()
    .eq("id", groupId)
    .eq("created_by", user.id);

  if (error) throw new Error("Failed to delete group");

  revalidatePath("/gym/groups");
}

// ── Send a group message ──
export async function sendGroupMessage(groupId: string, content: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase.from("group_messages").insert({
    group_id: groupId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) throw new Error("Failed to send message");
}

// ── Get group messages ──
export async function getGroupMessages(groupId: string, limit = 50) {
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("group_messages")
    .select(`
      id,
      content,
      created_at,
      sender_id,
      profiles (name)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return data || [];
}

// ── Get shared plan templates (for members viewing) ──
export async function getSharedPlanTemplates(sharedPlanId: string) {
  const { supabase } = await getUser();

  const { data: plan } = await supabase
    .from("group_shared_plans")
    .select("*")
    .eq("id", sharedPlanId)
    .eq("is_active", true)
    .single();

  if (!plan) throw new Error("Shared plan not found");

  let query = supabase
    .from("workout_templates")
    .select(`
      id,
      week_number,
      day_of_week,
      day_title,
      day_focus,
      is_rest_day,
      template_exercises (
        id,
        sets,
        reps,
        target_weight,
        rest_seconds,
        notes,
        sort_order,
        exercises (name, muscle_group, equipment)
      )
    `)
    .eq("program_id", plan.source_program_id)
    .order("week_number")
    .order("day_of_week");

  // Apply range filter
  if (plan.share_type === "range") {
    if (plan.week_start) query = query.gte("week_number", plan.week_start);
    if (plan.week_end) query = query.lte("week_number", plan.week_end);
    if (plan.day_start) query = query.gte("day_of_week", plan.day_start);
    if (plan.day_end) query = query.lte("day_of_week", plan.day_end);
  }

  const { data: templates } = await query;

  return {
    templates: templates || [],
    includeMeals: plan.include_meals,
    includeTimeline: plan.include_timeline,
  };
}

// ── Get pending invitations count (for nav badge) ──
export async function getPendingInvitationsCount() {
  const { supabase, user } = await getUser();

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  return count || 0;
}
