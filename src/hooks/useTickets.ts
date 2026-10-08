import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  fetchActiveTickets,
  fetchPendingTickets,
  createTicket,
  acceptTicket,
  refuseTicket,
  payTicket,
} from "../services/tickets";
import type { CapsuleTicket } from "../types";

let ticketsChannelCounter = 0;

export function useTickets(userId: string | undefined) {
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: ["tickets", "active", userId],
    queryFn: () => fetchActiveTickets(userId!),
    enabled: !!userId,
  });

  const pendingQuery = useQuery({
    queryKey: ["tickets", "pending", userId],
    queryFn: () => fetchPendingTickets(userId!),
    enabled: !!userId,
  });

  const launchCapsule = useMutation({
    mutationFn: ({ toUserId, motif }: { toUserId: string; motif: string }) => {
      if (!userId) throw new Error("No user");
      return createTicket(userId, toUserId, motif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const accept = useMutation({
    mutationFn: (ticketId: string) => acceptTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const refuse = useMutation({
    mutationFn: (ticketId: string) => refuseTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const decapsuler = useMutation({
    mutationFn: (ticketId: string) => payTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return {
    activeTickets: activeQuery.data ?? [],
    pendingTickets: pendingQuery.data ?? [],
    loading: activeQuery.isLoading || pendingQuery.isLoading,
    launchCapsule,
    accept,
    refuse,
    decapsuler,
  };
}

export function useTicketsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const channel = supabase
      .channel(`tickets_realtime_${ticketsChannelCounter++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          if (isMounted) {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (isMounted) {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [userId, queryClient]);
}

export type { CapsuleTicket };
