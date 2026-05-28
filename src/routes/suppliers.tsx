import { createFileRoute } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/suppliers")({ component: SuppliersPage });

function SuppliersPage() {
  const suppliers = useApp((s) => s.suppliers);
  const spares = useScopedSpares();
  return (
    <div className="space-y-4">
      <PageHeader title="Suppliers" description={`${suppliers.length} vendor partners`} />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Lead time</TableHead><TableHead className="text-right">Parts</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-sm">{s.contact}</TableCell>
                <TableCell className="text-sm">{s.email}</TableCell>
                <TableCell className="text-sm">{s.phone}</TableCell>
                <TableCell className="text-right text-sm">{s.leadTimeDays} d</TableCell>
                <TableCell className="text-right tabular-nums">{spares.filter((sp) => sp.supplier === s.id).length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
