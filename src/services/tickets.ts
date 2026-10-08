import { supabase } from "../lib/supabase";
import type { CapsuleTicket } from "../types";

export async function fetchActiveTickets(userId: string): Promise<CapsuleTicket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as CapsuleTicket[];
}

export async function fetchPendingTickets(userId: string): Promise<CapsuleTicket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("to_user", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as CapsuleTicket[];
}

export async function createTicket(
  fromUserId: string,
  toUserId: string,
  motif: string
): Promise<CapsuleTicket> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      from_user: fromUserId,
      to_user: toUserId,
      motif,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as CapsuleTicket;
}

export async function acceptTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.rpc("accept_ticket", { ticket_uuid: ticketId });
  if (error) throw error;
}

export async function refuseTicket(ticketId: string): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", ticketId);
  if (error) throw error;
}

export async function payTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.rpc("pay_ticket", { ticket_uuid: ticketId });
  if (error) throw error;
}
