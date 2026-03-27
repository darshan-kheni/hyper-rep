import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: weightLogs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("weight_logs")
      .select("weight_kg, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true })
      .limit(30),
  ]);

  return (
    <SettingsClient
      profile={profile}
      weightLogs={weightLogs || []}
      email={user.email || ""}
    />
  );
}
