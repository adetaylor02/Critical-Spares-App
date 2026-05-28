import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CriticalityBadge, Badge } from "@/components/StatusBadge";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/equipment")({ component: EquipmentPage });

function EquipmentPage() {
  const equipment = useScopedEquipment();
  const spares = useScopedSpares();
  const locations = useScopedLocations();

  const coverageFor = (assetId: string) => {
    const linked = spares.filter((s) => s.equipmentSupported.includes(assetId));
    if (linked.length === 0) return { tone: "danger" as const, label: "Not covered", count: 0 };
    const ok = linked.filter((s) => s.quantity >= s.minStock).length;
    if (ok === linked.length) return { tone: "success" as const, label: "Covered", count: linked.length };
    return { tone: "warning" as const, label: "Partially covered", count: linked.length };
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Equipment Mapping" description="Critical assets and their assigned spare coverage" />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manufacturer / Model</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Spares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((e) => {
                const cov = coverageFor(e.id);
                const linked = spares.filter((s) => s.equipmentSupported.includes(e.id));
                const risky = e.criticality === "Critical" && cov.count === 0;
                return (
                  <TableRow key={e.id} className={risky ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {risky && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {e.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{e.id}</div>
                    </TableCell>
                    <TableCell className="text-sm">{e.systemType}</TableCell>
                    <TableCell className="text-sm">{locations.find((l) => l.id === e.location)?.name}</TableCell>
                    <TableCell className="text-sm">{e.manufacturer} · {e.model}</TableCell>
                    <TableCell><CriticalityBadge level={e.criticality} /></TableCell>
                    <TableCell><Badge tone={cov.tone}>{cov.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {linked.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                        {linked.map((s) => (
                          <Link key={s.id} to="/inventory/$id" params={{ id: s.id }} className="rounded-full bg-secondary px-2 py-0.5 text-xs hover:bg-accent">
                            {s.partName}
                          </Link>
                        ))}
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
