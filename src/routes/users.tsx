import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, can } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ShieldOff } from "lucide-react";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["Admin", "Manager", "Technician", "Viewer"];

export const Route = createFileRoute("/users")({ component: UsersPage });

type Row = { id: string; email: string | null; display_name: string | null; roles: Role[] };

function UsersPage() {
  const { role, user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: profs }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const map = new Map<string, Role[]>();
    (roleRows ?? []).forEach((r) => {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role as Role);
      map.set(r.user_id, list);
    });
    setRows((profs ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] })));
  };
  useEffect(() => { load(); }, []);

  const setUserRole = async (userId: string, newRole: Role) => {
    setBusyId(userId);
    try {
      // Replace all roles with the new single role for simplicity
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (insErr) throw insErr;
      toast.success("Role updated");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusyId(null); }
  };

  if (!can(role, "users.manage")) {
    return (
      <div className="space-y-4">
        <PageHeader title="User Management" description={`Your role: ${role}`} />
        <Card className="p-10 text-center">
          <ShieldOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Only Admins can manage users and roles.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" description={rows ? `${rows.length} accounts` : "Loading…"} />
      <Card className="divide-y">
        {!rows && <div className="flex items-center justify-center p-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading users</div>}
        {rows?.map((u) => {
          const display = u.display_name || u.email || u.id;
          const highest = (["Admin","Manager","Technician","Viewer"] as Role[]).find((r) => u.roles.includes(r)) ?? "Viewer";
          const isSelf = user?.id === u.id;
          return (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar><AvatarFallback>{display.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{display}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={highest === "Admin" ? "primary" : highest === "Manager" ? "info" : highest === "Technician" ? "success" : "neutral"}>{highest}</Badge>
                <Select value={highest} onValueChange={(v) => setUserRole(u.id, v as Role)} disabled={busyId === u.id || isSelf}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
        {rows?.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No users yet.</div>}
      </Card>
      <p className="text-xs text-muted-foreground">Tip: Each user has one effective role. Changing it replaces their previous role. You cannot change your own role here — ask another Admin.</p>
      <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
    </div>
  );
}
