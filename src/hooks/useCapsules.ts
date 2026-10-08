import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  fetchActiveCapsules,
  fetchPendingCapsules,
  fetchAllCapsules,
  createCapsule,
  acceptCapsule,
  refuseCapsule,
  requestLaunchCapsule,
  authorizeLaunchCapsule,
} from "../services/capsules";
import type { Capsule } from "../types";

let capsulesChannelCounter = 0;

export function useCapsules(userId: string | undefined) {
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: ["capsules", "active", userId],
    queryFn: () => fetchActiveCapsules(userId!),
    enabled: !!userId,
  });

  const pendingQuery = useQuery({
    queryKey: ["capsules", "pending", userId],
    queryFn: () => fetchPendingCapsules(userId!),
    enabled: !!userId,
  });

  const allQuery = useQuery({
    queryKey: ["capsules", "all", userId],
    queryFn: () => fetchAllCapsules(userId!),
    enabled: !!userId,
  });

  const launchCapsule = useMutation({
    mutationFn: (params: {
      creditor_id: string;
      debtor_id: string;
      drink_type: string;
      amount: number;
      reason: string;
    }) => {
      if (!userId) throw new Error("No user");
      return createCapsule(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
    },
  });

  const accept = useMutation({
    mutationFn: (capsuleId: string) => acceptCapsule(capsuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
    },
  });

  const refuse = useMutation({
    mutationFn: (capsuleId: string) => refuseCapsule(capsuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
    },
  });

  const requestLaunch = useMutation({
    mutationFn: (capsuleId: string) => requestLaunchCapsule(capsuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
    },
  });

  const authorizeLaunch = useMutation({
    mutationFn: (capsuleId: string) => authorizeLaunchCapsule(capsuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capsules"] });
    },
  });

  return {
    activeCapsules: activeQuery.data ?? [],
    pendingCapsules: pendingQuery.data ?? [],
    allCapsules: allQuery.data ?? [],
    loading: activeQuery.isLoading || pendingQuery.isLoading,
    launchCapsule,
    accept,
    refuse,
    requestLaunch,
    authorizeLaunch,
  };
}

export function useCapsulesRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const channel = supabase
      .channel(`capsules_realtime_${capsulesChannelCounter++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "capsules" },
        () => {
          if (isMounted) {
            queryClient.invalidateQueries({ queryKey: ["capsules"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (isMounted) {
            queryClient.invalidateQueries({ queryKey: ["capsules"] });
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

export type { Capsule };
