"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/gym");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const currentWeight = parseFloat(formData.get("currentWeight") as string);
  const targetWeight = parseFloat(formData.get("targetWeight") as string);

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile with weight data (trigger auto-created the profile row)
  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        name,
        current_weight_kg: currentWeight || null,
        target_weight_kg: targetWeight || 80.0,
      })
      .eq("id", data.user.id);
  }

  redirect("/gym");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
