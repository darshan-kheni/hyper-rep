import { createClient } from "@/lib/supabase/server";
import { AIChatClient } from "./ai-chat-client";

export default async function AICoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return <AIChatClient userName={profile?.name || "there"} />;
}
