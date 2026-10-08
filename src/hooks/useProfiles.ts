import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { fetchAllProfiles } from "../services/profiles";
import type { UserProfile } from "../types";

let profilesChannelCounter = 0;

export function useProfiles(userId?: string) {
  const query = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  });

  const profiles: Record<string, UserProfile> = {};
  if (query.data) {
    for (const p of query.data) {
      profiles[p.id] = p;
    }
  }

  return {
    profiles,
    list: query.data ?? [],
    loading: query.isLoading,
  };
}

export function useProfilesRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const channel = supabase
      .channel(`profiles_realtime_${profilesChannelCounter++}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (isMounted) {
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
