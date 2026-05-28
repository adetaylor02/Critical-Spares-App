import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriticalityBadge, StockBadge, ConditionBadge, InspectionStatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, QrCode, Download, LogIn, LogOut, ArrowLeftRight, ShoppingCart, ClipboardCheck, Upload } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth, can } from "@/lib/auth";
import type { Condition } from "@/lib/types";

export const Route = createFileRoute("/inventory/$id")({ component: SpareDetail });

type Mode = null | "out" | "in" | "transfer" | "reorder" | "inspect";

function SpareDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const spare = useApp((s) => s.spares.find((x) => x.id === id));
  const equipment = useApp((s) => s.equipment);
  const locations = useApp((s) => s.locations);
  const suppliers = useApp((s) => s.suppliers);
  const allTransactions = useApp((s) => s.transactions);
  const allInspections = useApp((s) => s.inspections);
  const allReorders = useApp((s) => s.reorders);
  const allAuditLogs = useApp((s) => s.auditLogs);
  const checkOut = useApp((s) => s.checkOut);
  const checkIn = useApp((s) => s.checkIn);
  const transfer = useApp((s) => s.transfer);
  const addReorder = useApp((s) => s.addReorder);
  const addInspection = useApp((s) => s.addInspection);
  const currentUser = useApp((s) => s.currentUser);

  const [mode, setMode] = useState<Mode>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const transactions = useMemo(() => allTransactions.filter((t) => t.spareId === id), [allTransactions, id]);
  const inspections = useMemo(() => allInspections.filter((i) => i.spareId === id), [allInspections, id]);
  const reorders = useMemo(() => allReorders.filter((r) => r.spareId === id), [allReorders, id]);
  const audit = useMemo(() => allAuditLogs.filter((a) => a.entityId === id), [allAuditLogs, id]);

  if (!spare) {
    return (
      <div className="space-y-4">
        <PageHeader title="Spare not found" />
        <Button variant="outline" onClick={() => navigate({ to: "/inventory" })}><ArrowLeft className="mr-2 h-4 w-4" />Back to inventory</Button>
      </div>
    );
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${spare.id}-qr.png`;
    link.click();
  };

  const supplier = suppliers.find((s) => s.id === spare.supplier);
  const location = locations.find((l) => l.id === spare.location);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/inventory" })}><ArrowLeft className="mr-2 h-4 w-4" />Inventory</Button>
      <PageHeader
        title={spare.partName}
        description={`${spare.manufacturer} · ${spare.modelNumber}`}
        actions={
          <>
            {can(role, "inspection.create") && <Button variant="outline" onClick={() => setMode("inspect")}><ClipboardCheck className="mr-2 h-4 w-4" />Mark inspected</Button>}
            {can(role, "reorder.create") && <Button variant="outline" onClick={() => setMode("reorder")}><ShoppingCart className="mr-2 h-4 w-4" />Request reorder</Button>}
            {can(role, "tx.create") && <Button variant="outline" onClick={() => setMode("transfer")}><ArrowLeftRight className="mr-2 h-4 w-4" />Transfer</Button>}
            {can(role, "tx.create") && <Button variant="outline" onClick={() => setMode("in")}><LogIn className="mr-2 h-4 w-4" />Check in</Button>}
            {can(role, "tx.create") && <Button onClick={() => setMode("out")}><LogOut className="mr-2 h-4 w-4" />Check out</Button>}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
            <Info label="Description" value={spare.description || "—"} className="sm:col-span-2" />
            <Info label="Category" value={spare.category} />
            <Info label="Criticality" value={<CriticalityBadge level={spare.criticality} />} />
            <Info label="Stock" value={<div className="flex items-center gap-2"><span className="text-base font-semibold tabular-nums">{spare.quantity}</span><span className="text-xs text-muted-foreground">/ min {spare.minStock}</span><StockBadge qty={spare.quantity} min={spare.minStock} /></div>} />
            <Info label="Condition" value={<ConditionBadge condition={spare.condition} />} />
            <Info label="Unit cost" value={`$${spare.unitCost.toLocaleString()}`} />
            <Info label="Inventory value" value={`$${(spare.unitCost * spare.quantity).toLocaleString()}`} />
            <Info label="Location" value={`${location?.name ?? "—"} · ${spare.bin}`} />
            <Info label="Supplier" value={supplier?.name ?? "—"} />
            <Info label="Lead time" value={`${spare.leadTimeDays} days`} />
            <Info label="Serial #" value={spare.serialNumber || "—"} />
            <Info label="Last used" value={spare.lastUsed ? formatDistanceToNow(new Date(spare.lastUsed), { addSuffix: true }) : "—"} />
            <Info label="Last inspected" value={spare.lastInspected ? format(new Date(spare.lastInspected), "PP") : "—"} />
            <Info label="Expiry" value={spare.expiryDate ? format(new Date(spare.expiryDate), "PP") : "—"} />
            <Info label="Supported equipment" className="sm:col-span-2" value={
              spare.equipmentSupported.length === 0 ? <span className="text-muted-foreground">None linked</span> :
              <div className="flex flex-wrap gap-1.5">
                {spare.equipmentSupported.map((eid) => {
                  const e = equipment.find((x) => x.id === eid);
                  return e ? <span key={eid} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e.name}</span> : null;
                })}
              </div>
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-4 w-4" />QR code</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div ref={qrRef} className="rounded-lg border bg-white p-3">
              <QRCodeCanvas value={`${typeof window !== "undefined" ? window.location.origin : ""}/inventory/${spare.id}`} size={160} />
            </div>
            <div className="text-xs text-muted-foreground">ID: {spare.id}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadQR}><Download className="mr-2 h-4 w-4" />Download</Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Camera scanning would open here on mobile")}>Scan</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage history</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="reorders">Reorders</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-2">
          {transactions.length === 0 && <EmptyRow text="No transactions yet." />}
          {transactions.map((t) => (
            <Card key={t.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium capitalize">{t.type} · {t.quantity} unit{t.quantity > 1 ? "s" : ""}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.technician}{t.workOrder ? ` · ${t.workOrder}` : ""}{t.assetId ? ` · ${equipment.find(e=>e.id===t.assetId)?.name}` : ""}{t.reason ? ` · ${t.reason}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{format(new Date(t.timestamp), "PPp")}</div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="inspections" className="space-y-2">
          {inspections.length === 0 && <EmptyRow text="No inspections recorded." />}
          {inspections.map((i) => (
            <Card key={i.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{i.inspector} · <InspectionStatusBadge status={i.status} /></div>
                  <div className="mt-1 text-xs text-muted-foreground">{i.findings}</div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <div>Done: {format(new Date(i.inspectionDate), "PP")}</div>
                  <div>Next: {format(new Date(i.nextDue), "PP")}</div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reorders" className="space-y-2">
          {reorders.length === 0 && <EmptyRow text="No reorders for this part." />}
          {reorders.map((r) => (
            <Card key={r.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Qty {r.quantity} · ${r.estimatedCost.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{r.reason} · by {r.requestedBy}</div>
                </div>
                <Link to="/reorders" className="text-xs text-primary hover:underline">{r.status}</Link>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="docs" className="space-y-2">
          <Card className="p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Drop datasheets, photos, manuals, or certificates here.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info("Document upload requires Lovable Cloud storage")}>Upload document</Button>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-2">
          {audit.length === 0 && <EmptyRow text="No audit entries." />}
          {audit.map((a) => (
            <Card key={a.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm">{a.action} <span className="text-muted-foreground">— {a.details}</span></div>
                <div className="text-xs text-muted-foreground">{a.user} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <TxDialog
        mode={mode}
        onClose={() => setMode(null)}
        onCheckOut={(d) => { checkOut({ ...d, spareId: spare.id }); toast.success("Checked out"); setMode(null); }}
        onCheckIn={(d) => { checkIn({ ...d, spareId: spare.id }); toast.success("Checked in"); setMode(null); }}
        onTransfer={(d) => { transfer({ ...d, spareId: spare.id, technician: currentUser, fromLocation: spare.location }); toast.success("Transferred"); setMode(null); }}
        onReorder={(d) => { addReorder({ ...d, spareId: spare.id, supplier: spare.supplier, requestedBy: currentUser }); toast.success("Reorder requested"); setMode(null); }}
        onInspect={(d) => { addInspection({ ...d, spareId: spare.id, inspector: currentUser, inspectionDate: new Date().toISOString() }); toast.success("Inspection logged"); setMode(null); }}
        equipmentOptions={equipment.map((e) => ({ value: e.id, label: e.name }))}
        locationOptions={locations.map((l) => ({ value: l.id, label: l.name }))}
      />
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <Card className="p-6 text-center text-sm text-muted-foreground">{text}</Card>;
}

function TxDialog({
  mode, onClose, onCheckOut, onCheckIn, onTransfer, onReorder, onInspect,
  equipmentOptions, locationOptions,
}: {
  mode: Mode; onClose: () => void;
  onCheckOut: (d: { quantity: number; technician: string; workOrder?: string; assetId?: string; reason?: string }) => void;
  onCheckIn: (d: { quantity: number; technician: string; condition: Condition; toLocation: string; reason?: string }) => void;
  onTransfer: (d: { quantity: number; toLocation: string }) => void;
  onReorder: (d: { quantity: number; reason: string; estimatedCost: number; requiredBy: string }) => void;
  onInspect: (d: { condition: Condition; findings: string; status: "Pass" | "Monitor" | "Replace" | "Obsolete"; nextDue: string }) => void;
  equipmentOptions: { value: string; label: string }[];
  locationOptions: { value: string; label: string }[];
}) {
  const [qty, setQty] = useState(1);
  const [tech, setTech] = useState("");
  const [wo, setWo] = useState("");
  const [asset, setAsset] = useState("");
  const [reason, setReason] = useState("");
  const [cond, setCond] = useState<Condition>("Good");
  const [toLoc, setToLoc] = useState(locationOptions[0]?.value ?? "");
  const [cost, setCost] = useState(0);
  const [req, setReq] = useState("");
  const [findings, setFindings] = useState("");
  const [status, setStatus] = useState<"Pass" | "Monitor" | "Replace" | "Obsolete">("Pass");
  const [nextDue, setNextDue] = useState("");

  const open = mode !== null;
  const title = mode === "out" ? "Check out spare" : mode === "in" ? "Check in spare" : mode === "transfer" ? "Transfer location" : mode === "reorder" ? "Request reorder" : "Record inspection";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          {(mode === "out" || mode === "in" || mode === "transfer" || mode === "reorder") && (
            <div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
          )}
          {mode === "out" && (
            <>
              <div><Label>Technician</Label><Input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Name" /></div>
              <div><Label>Work order #</Label><Input value={wo} onChange={(e) => setWo(e.target.value)} placeholder="WO-1234" /></div>
              <div>
                <Label>Asset / equipment</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{equipmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            </>
          )}
          {mode === "in" && (
            <>
              <div><Label>Technician</Label><Input value={tech} onChange={(e) => setTech(e.target.value)} /></div>
              <div>
                <Label>Condition</Label>
                <Select value={cond} onValueChange={(v) => setCond(v as Condition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["New","Good","Needs Inspection","Damaged","Obsolete"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Return location</Label>
                <Select value={toLoc} onValueChange={setToLoc}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{locationOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            </>
          )}
          {mode === "transfer" && (
            <div>
              <Label>To location</Label>
              <Select value={toLoc} onValueChange={setToLoc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{locationOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {mode === "reorder" && (
            <>
              <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <div><Label>Estimated cost ($)</Label><Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></div>
              <div><Label>Required by</Label><Input type="date" value={req} onChange={(e) => setReq(e.target.value)} /></div>
            </>
          )}
          {mode === "inspect" && (
            <>
              <div>
                <Label>Condition</Label>
                <Select value={cond} onValueChange={(v) => setCond(v as Condition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["New","Good","Needs Inspection","Damaged","Obsolete"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Pass","Monitor","Replace","Obsolete"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Findings</Label><Textarea rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} /></div>
              <div><Label>Next due</Label><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (mode === "out") onCheckOut({ quantity: qty, technician: tech || "Unknown", workOrder: wo, assetId: asset, reason });
            if (mode === "in") onCheckIn({ quantity: qty, technician: tech || "Unknown", condition: cond, toLocation: toLoc, reason });
            if (mode === "transfer") onTransfer({ quantity: qty, toLocation: toLoc });
            if (mode === "reorder") onReorder({ quantity: qty, reason, estimatedCost: cost, requiredBy: req ? new Date(req).toISOString() : new Date().toISOString() });
            if (mode === "inspect") onInspect({ condition: cond, findings, status, nextDue: nextDue ? new Date(nextDue).toISOString() : new Date(Date.now() + 90*86400000).toISOString() });
          }}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
