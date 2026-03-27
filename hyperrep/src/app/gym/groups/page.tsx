import { createClient } from "@/lib/supabase/server";
import { GroupsClient } from "./groups-client";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      id,
      role,
      status,
      invited_at,
      workout_groups (
        id,
        name,
        description,
        invite_code,
        created_by
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["accepted", "pending"])
    .order("invited_at", { ascending: false });

  // Get member counts for each group
  const groups = [];
  const pending = [];

  for (const m of memberships || []) {
    const group = Array.isArray(m.workout_groups)
      ? m.workout_groups[0]
      : m.workout_groups;
    if (!group) continue;

    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id)
      .eq("status", "accepted");

    const item = {
      membershipId: m.id,
      role: m.role,
      status: m.status,
      groupId: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.invite_code,
      isManager: group.created_by === user.id,
      memberCount: count || 0,
    };

    if (m.status === "pending") {
      pending.push(item);
    } else {
      groups.push(item);
    }
  }

  return <GroupsClient groups={groups} pendingInvitations={pending} />;
}
