import { createClient } from "@/lib/supabase/server";
import { GroupDetailClient } from "./group-detail-client";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Verify membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "accepted") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-muted">You are not a member of this group.</p>
      </div>
    );
  }

  const [{ data: group }, { data: members }, { data: sharedPlans }, { data: messages }] =
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
      supabase
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
        .limit(100),
    ]);

  if (!group) return null;

  return (
    <GroupDetailClient
      group={group}
      members={members || []}
      sharedPlans={sharedPlans || []}
      initialMessages={messages || []}
      myRole={membership.role}
      userId={user.id}
    />
  );
}
