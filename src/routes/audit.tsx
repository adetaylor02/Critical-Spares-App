import { createFileRoute } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth, can } from "@/lib/auth";
import { ShieldOff } from "lucide-react";

export const Route = createFileRoute("/audit")({ component: AuditPage });

function AuditPage() {
  const { role } = useAuth();
  const logs = useScopedAuditLogs();
  if (!can(role, "audit.view")) {
    return (
      <div className="space-y-4">
        <PageHeader title="Audit Logs" description={`Your role: ${role}`} />
        <Card className="p-10 text-center">
          <ShieldOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Manager or Admin role required to view audit logs.</p>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Audit Logs" description={`${logs.length} entries — every key action is recorded`} />
      <Card className="divide-y">
        {logs.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <div className="text-sm font-medium">{a.action}</div>
              <div className="text-xs text-muted-foreground">{a.entity} · {a.entityId}{a.details ? ` · ${a.details}` : ""}</div>
            </div>
            <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
              <div>{a.user}</div>
              <div>{format(new Date(a.timestamp), "PPp")}</div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">No actions logged yet.</div>}
      </Card>
    </div>
  );
}
