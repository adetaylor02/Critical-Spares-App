import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import type { SparePart, SystemCategory, Criticality, Condition } from "@/lib/types";
import { toast } from "sonner";

const CATEGORIES: SystemCategory[] = ["UPS","PDU","Switchgear","Generator","ATS","Chiller","CRAH","Fire Alarm","BMS","Controls","Network","Other"];
const CRITICALITY: Criticality[] = ["Critical","High","Medium","Low"];
const CONDITIONS: Condition[] = ["New","Good","Needs Inspection","Damaged","Obsolete"];

export function SpareFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: SparePart | null }) {
  const addSpare = useApp((s) => s.addSpare);
  const updateSpare = useApp((s) => s.updateSpare);
  const suppliers = useApp((s) => s.suppliers);
  const locations = useApp((s) => s.locations);
  const equipment = useApp((s) => s.equipment);

  const [form, setForm] = useState<Partial<SparePart>>({});

  useEffect(() => {
    if (editing) setForm(editing);
    else setForm({
      partName: "", description: "", manufacturer: "", modelNumber: "",
      category: "UPS", criticality: "Medium", condition: "New",
      minStock: 1, quantity: 0, unitCost: 0, leadTimeDays: 14,
      location: locations[0]?.id ?? "", bin: "", supplier: suppliers[0]?.id ?? "",
      equipmentSupported: [],
    });
  }, [editing, open, locations, suppliers]);

  const set = <K extends keyof SparePart>(k: K, v: SparePart[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.partName || !form.manufacturer) { toast.error("Part name and manufacturer required"); return; }
    if (editing) {
      updateSpare(editing.id, form);
      toast.success("Spare updated");
    } else {
      addSpare(form as Omit<SparePart, "id" | "createdAt" | "documents">);
      toast.success("Spare added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit spare" : "Add new spare"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Part name"><Input value={form.partName ?? ""} onChange={(e) => set("partName", e.target.value)} /></Field>
          <Field label="Manufacturer"><Input value={form.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value)} /></Field>
          <Field label="Model number"><Input value={form.modelNumber ?? ""} onChange={(e) => set("modelNumber", e.target.value)} /></Field>
          <Field label="Serial number"><Input value={form.serialNumber ?? ""} onChange={(e) => set("serialNumber", e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v as SystemCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Criticality">
            <Select value={form.criticality} onValueChange={(v) => set("criticality", v as Criticality)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CRITICALITY.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Condition">
            <Select value={form.condition} onValueChange={(v) => set("condition", v as Condition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Min stock"><Input type="number" value={form.minStock ?? 0} onChange={(e) => set("minStock", Number(e.target.value))} /></Field>
          <Field label="Quantity"><Input type="number" value={form.quantity ?? 0} onChange={(e) => set("quantity", Number(e.target.value))} /></Field>
          <Field label="Unit cost ($)"><Input type="number" value={form.unitCost ?? 0} onChange={(e) => set("unitCost", Number(e.target.value))} /></Field>
          <Field label="Lead time (days)"><Input type="number" value={form.leadTimeDays ?? 0} onChange={(e) => set("leadTimeDays", Number(e.target.value))} /></Field>
          <Field label="Location">
            <Select value={form.location} onValueChange={(v) => set("location", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Bin / shelf"><Input value={form.bin ?? ""} onChange={(e) => set("bin", e.target.value)} /></Field>
          <Field label="Supplier">
            <Select value={form.supplier} onValueChange={(v) => set("supplier", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Expiry date"><Input type="date" value={form.expiryDate?.slice(0,10) ?? ""} onChange={(e) => set("expiryDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)} /></Field>
          <Field label="Equipment supported" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              {equipment.map((e) => {
                const checked = form.equipmentSupported?.includes(e.id);
                return (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => {
                      const cur = form.equipmentSupported ?? [];
                      set("equipmentSupported", checked ? cur.filter((id) => id !== e.id) : [...cur, e.id]);
                    }}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                  >
                    {e.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{editing ? "Save changes" : "Add spare"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
