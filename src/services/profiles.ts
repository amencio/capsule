import { supabase } from "../lib/supabase";
import type { UserProfile } from "../types";

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("pseudo", { ascending: true });
  if (error) throw error;
  return data as UserProfile[];
}

export async function updateProfilePseudo(
  userId: string,
  pseudo: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ pseudo })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);
  if (error) throw error;
}
