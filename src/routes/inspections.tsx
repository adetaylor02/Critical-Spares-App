import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InspectionStatusBadge, ConditionBadge, Badge } from "@/components/StatusBadge";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/inspections")({ component: InspectionsPage });

function InspectionsPage() {
  const inspections = useScopedInspections();
  const spares = useScopedSpares();
  const now = Date.now();

  const sorted = [...inspections].sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

  return (
    <div className="space-y-4">
      <PageHeader title="Inspections" description="Periodic checks on critical spare parts" />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spare</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Last inspection</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((i) => {
                const sp = spares.find((s) => s.id === i.spareId);
                const overdue = new Date(i.nextDue).getTime() < now;
                return (
                  <TableRow key={i.id} className={overdue ? "bg-warning/5" : ""}>
                    <TableCell>{sp ? <Link to="/inventory/$id" params={{ id: sp.id }} className="font-medium hover:underline">{sp.partName}</Link> : i.spareId}</TableCell>
                    <TableCell className="text-sm">{i.inspector}</TableCell>
                    <TableCell className="text-sm">{format(new Date(i.inspectionDate), "PP")}</TableCell>
                    <TableCell><ConditionBadge condition={i.condition} /></TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground">{i.findings}</TableCell>
                    <TableCell><InspectionStatusBadge status={i.status} /></TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(i.nextDue), "PP")}
                      <div className="text-xs">
                        {overdue ? <Badge tone="danger">Overdue · {formatDistanceToNow(new Date(i.nextDue))}</Badge> : <span className="text-muted-foreground">in {formatDistanceToNow(new Date(i.nextDue))}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
