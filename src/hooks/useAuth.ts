import { useState, useEffect, useCallback, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchProfile } from "../services/profiles";
import type { UserProfile } from "../types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted.current) return;
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id)
          .then((p) => {
            if (isMounted.current) setProfile(p);
          })
          .catch(() => {
            if (isMounted.current) setProfile(null);
          })
          .finally(() => {
            if (isMounted.current) setLoading(false);
          });
      } else {
        if (isMounted.current) setLoading(false);
      }
    }).catch(() => {
      if (isMounted.current) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted.current) return;
        setSession(newSession);
        if (newSession?.user) {
          try {
            const p = await fetchProfile(newSession.user.id);
            if (isMounted.current) setProfile(p);
          } catch {
            if (isMounted.current) setProfile(null);
          }
        } else {
          if (isMounted.current) setProfile(null);
        }
        if (isMounted.current) setLoading(false);
      }
    );

    return () => {
      isMounted.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, pseudo: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo },
        emailRedirectTo: "capsule://login",
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  return { session, profile, loading, signIn, signUp, signOut };
}
