import { createFileRoute } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/StatusBadge";
import { format } from "date-fns";

export const Route = createFileRoute("/transactions")({ component: TxPage });

function TxPage() {
  const txs = useScopedTransactions();
  const spares = useScopedSpares();
  const locations = useScopedLocations();

  const render = (filter?: "check-in" | "check-out" | "transfer") => {
    const list = filter ? txs.filter((t) => t.type === filter) : txs;
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Spare</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((t) => {
                const sp = spares.find((s) => s.id === t.spareId);
                const tone = t.type === "check-out" ? "warning" : t.type === "check-in" ? "success" : "info";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(t.timestamp), "PPp")}</TableCell>
                    <TableCell><Badge tone={tone as never}>{t.type}</Badge></TableCell>
                    <TableCell>{sp?.partName ?? t.spareId}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                    <TableCell>{t.technician}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.workOrder && <>WO {t.workOrder} · </>}
                      {t.reason}
                      {t.fromLocation && <>{locations.find((l) => l.id === t.fromLocation)?.name} → {locations.find((l) => l.id === t.toLocation)?.name}</>}
                      {!t.fromLocation && t.toLocation && <>→ {locations.find((l) => l.id === t.toLocation)?.name}</>}
                      {t.condition && <> · {t.condition}</>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No transactions.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Check In / Out" description="Complete transaction history across all spares" />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="check-out">Check-outs</TabsTrigger>
          <TabsTrigger value="check-in">Check-ins</TabsTrigger>
          <TabsTrigger value="transfer">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{render()}</TabsContent>
        <TabsContent value="check-out">{render("check-out")}</TabsContent>
        <TabsContent value="check-in">{render("check-in")}</TabsContent>
        <TabsContent value="transfer">{render("transfer")}</TabsContent>
      </Tabs>
    </div>
  );
}
