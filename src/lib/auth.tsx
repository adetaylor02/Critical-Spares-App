import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "./types";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role;
  roles: Role[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_RANK: Record<Role, number> = { Viewer: 0, Technician: 1, Manager: 2, Admin: 3 };

function highestRole(rs: Role[]): Role {
  if (rs.length === 0) return "Viewer";
  return rs.reduce((acc, r) => (ROLE_RANK[r] > ROLE_RANK[acc] ? r : acc), rs[0]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileAndRoles = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(prof ?? null);
    setRoles(((roleRows ?? []) as { role: Role }[]).map((r) => r.role));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer to avoid deadlock per Supabase guidance
        setTimeout(() => { loadProfileAndRoles(s.user.id); }, 0);
      } else {
        setProfile(null); setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfileAndRoles(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfileAndRoles]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    role: highestRole(roles),
    roles,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password, displayName) => {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: displayName } },
      });
      if (error) throw error;
    },
    signInGoogle: async () => {
      const mod = await import("@/integrations/lovable/index");
      const result = await mod.lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
    },
    signOut: async () => { await supabase.auth.signOut(); },
    refreshRoles: async () => { if (session?.user) await loadProfileAndRoles(session.user.id); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Permission helpers
export type Action =
  | "spare.create" | "spare.edit" | "spare.delete"
  | "tx.create"
  | "reorder.create" | "reorder.approve"
  | "inspection.create"
  | "users.manage"
  | "audit.view"
  | "settings.manage";

const RULES: Record<Action, Role> = {
  "spare.create": "Manager",
  "spare.edit": "Manager",
  "spare.delete": "Admin",
  "tx.create": "Technician",
  "reorder.create": "Technician",
  "reorder.approve": "Manager",
  "inspection.create": "Technician",
  "users.manage": "Admin",
  "audit.view": "Manager",
  "settings.manage": "Admin",
};

export function can(role: Role, action: Action): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[RULES[action]];
}

export function Gate({ action, role, children, fallback = null }: { action: Action; role: Role; children: ReactNode; fallback?: ReactNode }) {
  return can(role, action) ? <>{children}</> : <>{fallback}</>;
}
