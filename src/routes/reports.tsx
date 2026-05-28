import { createFileRoute } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const spares = useScopedSpares();
  const reorders = useScopedReorders();
  const inspections = useScopedInspections();
  const transactions = useScopedTransactions();
  const equipment = useScopedEquipment();

  const totalValue = spares.reduce((n, s) => n + s.unitCost * s.quantity, 0);
  const reports = [
    { name: "Current inventory", desc: `${spares.length} parts · $${totalValue.toLocaleString()} value`, build: () => spares.map((s) => ({ id: s.id, part: s.partName, qty: s.quantity, unitCost: s.unitCost, value: s.quantity * s.unitCost })) },
    { name: "Low stock", desc: `${spares.filter((s) => s.quantity < s.minStock).length} items`, build: () => spares.filter((s) => s.quantity < s.minStock).map((s) => ({ id: s.id, part: s.partName, qty: s.quantity, min: s.minStock })) },
    { name: "Critical spares coverage", desc: `${equipment.filter((e) => e.criticality === "Critical").length} critical assets`, build: () => equipment.map((e) => ({ id: e.id, asset: e.name, criticality: e.criticality, spares: spares.filter((s) => s.equipmentSupported.includes(e.id)).length })) },
    { name: "Spare usage history", desc: `${transactions.length} transactions`, build: () => transactions },
    { name: "Reorders", desc: `${reorders.length} requests`, build: () => reorders },
    { name: "Inspection compliance", desc: `${inspections.length} inspections`, build: () => inspections },
    { name: "Obsolete / damaged", desc: `${spares.filter((s) => s.condition === "Damaged" || s.condition === "Obsolete").length} items`, build: () => spares.filter((s) => s.condition === "Damaged" || s.condition === "Obsolete") },
    { name: "Inventory valuation", desc: `$${totalValue.toLocaleString()} total`, build: () => spares.map((s) => ({ part: s.partName, qty: s.quantity, unitCost: s.unitCost, value: s.quantity * s.unitCost })) },
  ];

  const downloadCSV = (name: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) { toast.info("No data for this report"); return; }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.csv`; a.click();
    toast.success(`${name} exported`);
  };

  const downloadPDF = (name: string, rows: Record<string, unknown>[]) => {
    // Simple printable HTML "PDF" via window.print on a generated doc
    const w = window.open("", "_blank"); if (!w) return;
    const keys = rows[0] ? Object.keys(rows[0]) : [];
    w.document.write(`<html><head><title>${name}</title>
      <style>body{font:14px system-ui;padding:24px;color:#0f172a}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:12px}th{background:#f1f5f9}</style>
      </head><body><h1>${name}</h1><div>Generated ${new Date().toLocaleString()}</div>
      <table><thead><tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${String(r[k] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>
      </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Operational reporting and exports" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.name}>
            <CardHeader><CardTitle className="text-base">{r.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{r.desc}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(r.name, r.build() as never)}><Download className="mr-2 h-4 w-4" />CSV</Button>
                <Button variant="outline" size="sm" onClick={() => downloadPDF(r.name, r.build() as never)}><Download className="mr-2 h-4 w-4" />PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
