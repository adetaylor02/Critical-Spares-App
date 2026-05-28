import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReorderStatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { useAuth, can } from "@/lib/auth";
import type { ReorderStatus } from "@/lib/types";

export const Route = createFileRoute("/reorders")({ component: ReordersPage });

const STATUSES: ReorderStatus[] = ["Draft","Pending Approval","Approved","Ordered","Received","Cancelled"];

function ReordersPage() {
  const { role } = useAuth();
  const reorders = useScopedReorders();
  const spares = useScopedSpares();
  const suppliers = useApp((s) => s.suppliers);
  const currentUser = useApp((s) => s.currentUser);
  const setStatus = useApp((s) => s.setReorderStatus);
  const addReorder = useApp((s) => s.addReorder);

  const lowStock = spares.filter((s) => s.quantity < s.minStock);

  const quickReorder = (spareId: string) => {
    const s = spares.find((x) => x.id === spareId);
    if (!s) return;
    const qty = Math.max(s.minStock - s.quantity, s.minStock);
    addReorder({
      spareId, quantity: qty, reason: "Auto-generated from low stock",
      supplier: s.supplier, estimatedCost: qty * s.unitCost,
      requiredBy: new Date(Date.now() + s.leadTimeDays * 86400000).toISOString(),
      requestedBy: currentUser,
    });
    toast.success(`Reorder requested for ${s.partName}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reorder Management" description={`${reorders.length} requests · ${lowStock.length} parts need attention`} />

      {lowStock.length > 0 && (
        <Card className="border-warning/40 bg-warning/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            Parts below minimum stock
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border bg-background p-3">
                <div className="min-w-0">
                  <Link to="/inventory/$id" params={{ id: s.id }} className="block truncate text-sm font-medium hover:underline">{s.partName}</Link>
                  <div className="text-xs text-muted-foreground">{s.quantity} / {s.minStock} on hand</div>
                </div>
                {can(role, "reorder.create") && (
                  <Button size="sm" variant="outline" onClick={() => quickReorder(s.id)}>Reorder</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Est. cost</TableHead>
                <TableHead>Required by</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorders.map((r) => {
                const sp = spares.find((s) => s.id === r.spareId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{sp ? <Link to="/inventory/$id" params={{ id: sp.id }} className="font-medium hover:underline">{sp.partName}</Link> : r.spareId}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-sm">{suppliers.find((s) => s.id === r.supplier)?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">${r.estimatedCost.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{format(new Date(r.requiredBy), "PP")}</TableCell>
                    <TableCell className="text-sm">{r.requestedBy}</TableCell>
                    <TableCell><ReorderStatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      {can(role, "reorder.approve") ? (
                        <Select value={r.status} onValueChange={(v) => { setStatus(r.id, v as ReorderStatus); toast.success(`Status → ${v}`); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manager+ only</span>
                      )}
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
