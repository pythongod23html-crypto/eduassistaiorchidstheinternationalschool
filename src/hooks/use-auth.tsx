import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getMyContext } from "@/lib/auth.functions";

type Role = "admin" | "student" | "parent" | "teacher" | null;

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  role: Role;
  student: Awaited<ReturnType<typeof getMyContext>>["student"] | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e: string, s: Session | null) => {
      setSession(s);
      if (!s) {
        qc.removeQueries({ queryKey: ["me"] });
      } else {
        qc.invalidateQueries({ queryKey: ["me"] });
      }
    });
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const { data } = useQuery({
    queryKey: ["me", session?.user.id],
    queryFn: async () => {
      try {
        return await getMyContext();
      } catch (e) {
        console.error("getMyContext failed", e);
        return { role: null, student: null, userId: session?.user.id ?? "" };
      }
    },
    enabled: !!session,
    retry: false,
  });

  const value: AuthContextValue = {
    session,
    loading,
    role: (data?.role as Role) ?? null,
    student: data?.student ?? null,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}