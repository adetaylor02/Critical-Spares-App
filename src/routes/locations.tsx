import { createFileRoute } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/locations")({ component: LocationsPage });

function LocationsPage() {
  const locations = useScopedLocations();
  const spares = useScopedSpares();
  return (
    <div className="space-y-4">
      <PageHeader title="Locations" description={`${locations.length} storage areas`} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Building</TableHead><TableHead>Room</TableHead><TableHead className="text-right">Parts</TableHead><TableHead className="text-right">Units</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((l) => {
              const local = spares.filter((s) => s.location === l.id);
              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-sm">{l.building}</TableCell>
                  <TableCell className="text-sm">{l.room}</TableCell>
                  <TableCell className="text-right tabular-nums">{local.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{local.reduce((n, s) => n + s.quantity, 0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
