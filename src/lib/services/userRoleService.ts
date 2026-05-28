import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/types";

/**
 * User & role management.
 *
 * Today: backed by Lovable Cloud `user_roles` table.
 * Migration target: Microsoft Entra ID groups mapped to roles —
 *   CriticalSpares_Admins      -> Admin
 *   CriticalSpares_Managers    -> Manager
 *   CriticalSpares_Technicians -> Technician
 *   CriticalSpares_Viewers     -> Viewer
 */
export const userRoleService = {
  async getAll() {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at");
    if (error) throw error;
    return data ?? [];
  },
  async getById(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.role as Role);
  },
  async create(userId: string, role: Role) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) throw error;
  },
  async update(userId: string, role: Role) {
    // Replace existing role assignments
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
  },
  async delete(userId: string, role: Role) {
    const { error } = await supabase
      .from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) throw error;
  },
  search: async (_q: string) => { throw new Error("Not implemented"); },
  filterBySite: async () => { throw new Error("Roles are tenant-wide; site scoping handled in app logic"); },
};

export const ENTRA_GROUP_TO_ROLE: Record<string, Role> = {
  CriticalSpares_Admins: "Admin",
  CriticalSpares_Managers: "Manager",
  CriticalSpares_Technicians: "Technician",
  CriticalSpares_Viewers: "Viewer",
};
