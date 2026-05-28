import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StockBadge, CriticalityBadge, ConditionBadge } from "@/components/StatusBadge";
import { Plus, Eye, Pencil, Copy, Trash2, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { SpareFormDialog } from "@/components/SpareFormDialog";
import { toast } from "sonner";
import { useAuth, can } from "@/lib/auth";
import type { SparePart } from "@/lib/types";

type Search = { q?: string };

export const Route = createFileRoute("/inventory/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: typeof s.q === "string" ? s.q : undefined }),
  component: InventoryPage,
});

function InventoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { role } = useAuth();
  const spares = useScopedSpares();
  const locations = useScopedLocations();
  const suppliers = useApp((s) => s.suppliers);
  const deleteSpare = useApp((s) => s.deleteSpare);
  const duplicate = useApp((s) => s.duplicateSpare);

  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState<string>("all");
  const [crit, setCrit] = useState<string>("all");
  const [stock, setStock] = useState<string>("all");
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    return spares.filter((s) => {
      if (text && !`${s.partName} ${s.manufacturer} ${s.modelNumber} ${s.description}`.toLowerCase().includes(text)) return false;
      if (cat !== "all" && s.category !== cat) return false;
      if (crit !== "all" && s.criticality !== crit) return false;
      if (stock === "low" && !(s.quantity > 0 && s.quantity < s.minStock)) return false;
      if (stock === "out" && s.quantity !== 0) return false;
      if (stock === "ok" && s.quantity < s.minStock) return false;
      return true;
    });
  }, [spares, q, cat, crit, stock]);

  const exportCsv = () => {
    const rows = [
      ["ID", "Part", "Manufacturer", "Model", "Category", "Criticality", "Qty", "Min", "Unit Cost", "Location", "Condition"],
      ...filtered.map((s) => [s.id, s.partName, s.manufacturer, s.modelNumber, s.category, s.criticality, s.quantity, s.minStock, s.unitCost, locations.find(l=>l.id===s.location)?.name ?? "", s.condition]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "inventory.csv"; a.click();
    toast.success("Inventory exported");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Spare Inventory"
        description={`${filtered.length} of ${spares.length} parts`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
            {can(role, "spare.create") && (
              <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add spare</Button>
            )}
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => { setQ(e.target.value); navigate({ to: "/inventory", search: { q: e.target.value } }); }} placeholder="Search parts…" className="max-w-xs" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {["UPS","PDU","Switchgear","Generator","ATS","Chiller","CRAH","Fire Alarm","BMS","Controls","Network","Other"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={crit} onValueChange={setCrit}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Criticality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All criticality</SelectItem>
              {["Critical","High","Medium","Low"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={setStock}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="ok">In stock</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link to="/inventory/$id" params={{ id: s.id }} className="font-medium hover:underline">{s.partName}</Link>
                    <div className="text-xs text-muted-foreground">{s.manufacturer} · {s.modelNumber}</div>
                  </TableCell>
                  <TableCell><span className="text-sm">{s.category}</span></TableCell>
                  <TableCell><CriticalityBadge level={s.criticality} /></TableCell>
                  <TableCell className="text-right tabular-nums">{s.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{s.minStock}</TableCell>
                  <TableCell><StockBadge qty={s.quantity} min={s.minStock} /></TableCell>
                  <TableCell><ConditionBadge condition={s.condition} /></TableCell>
                  <TableCell className="text-sm">{locations.find((l) => l.id === s.location)?.name}</TableCell>
                  <TableCell className="text-sm">{suppliers.find((sp) => sp.id === s.supplier)?.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link to="/inventory/$id" params={{ id: s.id }}><Eye className="h-4 w-4" /></Link></Button>
                      {can(role, "spare.edit") && (
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      )}
                      {can(role, "spare.create") && (
                        <Button variant="ghost" size="icon" onClick={() => { duplicate(s.id); toast.success("Duplicated"); }}><Copy className="h-4 w-4" /></Button>
                      )}
                      {can(role, "spare.delete") && (
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${s.partName}?`)) { deleteSpare(s.id); toast.success("Deleted"); } }}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">No spares match the current filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <SpareFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
