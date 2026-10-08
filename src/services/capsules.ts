import { supabase } from "../lib/supabase";
import type { Capsule } from "../types";

export async function fetchActiveCapsules(userId: string): Promise<Capsule[]> {
  const { data, error } = await supabase
    .from("capsules")
    .select("*")
    .or(`creditor_id.eq.${userId},debtor_id.eq.${userId}`)
    .in("status", ["active", "pending_launch"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Capsule[];
}

export async function fetchPendingCapsules(userId: string): Promise<Capsule[]> {
  const { data, error } = await supabase
    .from("capsules")
    .select("*")
    .eq("debtor_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Capsule[];
}

export async function fetchAllCapsules(userId: string): Promise<Capsule[]> {
  const { data, error } = await supabase
    .from("capsules")
    .select("*")
    .or(`creditor_id.eq.${userId},debtor_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Capsule[];
}

export async function createCapsule(params: {
  creditor_id: string;
  debtor_id: string;
  drink_type: string;
  amount: number;
  reason: string;
}): Promise<Capsule> {
  const { data, error } = await supabase
    .from("capsules")
    .insert({
      creditor_id: params.creditor_id,
      debtor_id: params.debtor_id,
      drink_type: params.drink_type,
      amount: params.amount,
      reason: params.reason,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Capsule;
}

export async function acceptCapsule(capsuleId: string): Promise<void> {
  const { error } = await supabase.rpc("accept_capsule", {
    capsule_uuid: capsuleId,
  });
  if (error) throw error;
}

export async function refuseCapsule(capsuleId: string): Promise<void> {
  const { error } = await supabase
    .from("capsules")
    .delete()
    .eq("id", capsuleId);
  if (error) throw error;
}

export async function requestLaunchCapsule(capsuleId: string): Promise<void> {
  const { error } = await supabase.rpc("request_launch", {
    capsule_uuid: capsuleId,
  });
  if (error) throw error;
}

export async function authorizeLaunchCapsule(capsuleId: string): Promise<void> {
  const { error } = await supabase.rpc("authorize_launch", {
    capsule_uuid: capsuleId,
  });
  if (error) throw error;
}
