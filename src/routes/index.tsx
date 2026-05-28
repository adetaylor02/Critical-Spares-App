import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, useScopedSpares, useScopedEquipment, useScopedTransactions, useScopedReorders, useScopedInspections, useScopedLocations, useScopedAuditLogs } from "@/lib/store";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import {
  Package, AlertTriangle, XCircle, Clock, ClipboardCheck, ShoppingCart, ShieldAlert, ArrowLeftRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { StockBadge, CriticalityBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const spares = useScopedSpares();
  const equipment = useScopedEquipment();
  const inspections = useScopedInspections();
  const reorders = useScopedReorders();
  const transactions = useScopedTransactions();

  const now = Date.now();
  const total = spares.length;
  const low = spares.filter((s) => s.quantity > 0 && s.quantity < s.minStock).length;
  const oos = spares.filter((s) => s.quantity === 0).length;
  const expiring = spares.filter((s) => s.expiryDate && new Date(s.expiryDate).getTime() - now < 1000 * 86400 * 120).length;
  const dueInspection = inspections.filter((i) => new Date(i.nextDue).getTime() < now).length;
  const openReorders = reorders.filter((r) => r.status === "Pending Approval" || r.status === "Approved" || r.status === "Ordered").length;
  const uncovered = equipment.filter((e) => e.criticality === "Critical" && !spares.some((s) => s.equipmentSupported.includes(e.id))).length;

  const byCategory = Object.entries(
    spares.reduce<Record<string, number>>((acc, s) => { acc[s.category] = (acc[s.category] ?? 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const stockStatus = [
    { name: "In stock", value: total - low - oos },
    { name: "Low", value: low },
    { name: "Out", value: oos },
  ];

  const byCriticality = Object.entries(
    spares.reduce<Record<string, number>>((acc, s) => { acc[s.criticality] = (acc[s.criticality] ?? 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // monthly usage based on check-out transactions
  const usage: { month: string; qty: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    const label = d.toLocaleString(undefined, { month: "short" });
    const qty = transactions
      .filter((t) => t.type === "check-out" && new Date(t.timestamp).getMonth() === d.getMonth() && new Date(t.timestamp).getFullYear() === d.getFullYear())
      .reduce((sum, t) => sum + t.quantity, 0);
    usage.push({ month: label, qty });
  }

  const pieColors = ["var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Real-time view of spare inventory, risk exposure, and operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total spares" value={total} hint={`${spares.reduce((n, s) => n + s.quantity, 0)} units in stock`} icon={Package} />
        <MetricCard label="Low stock" value={low} hint="Below minimum" icon={AlertTriangle} tone="warning" />
        <MetricCard label="Out of stock" value={oos} hint="Zero on hand" icon={XCircle} tone="danger" />
        <MetricCard label="Expiring soon" value={expiring} hint="Within 120 days" icon={Clock} tone="info" />
        <MetricCard label="Inspections due" value={dueInspection} hint="Overdue or due now" icon={ClipboardCheck} tone="warning" />
        <MetricCard label="Open reorders" value={openReorders} hint="Pending → ordered" icon={ShoppingCart} tone="info" />
        <MetricCard label="Uncovered critical assets" value={uncovered} hint="No spare assigned" icon={ShieldAlert} tone="danger" />
        <MetricCard label="Recent movements" value={transactions.length} hint="All-time transactions" icon={ArrowLeftRight} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Inventory by category</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock status</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {stockStatus.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Criticality breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCriticality} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly usage (check-outs)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="qty" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent spare movements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {transactions.slice(0, 6).map((t) => {
              const sp = spares.find((s) => s.id === t.spareId);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{sp?.partName ?? t.spareId}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.type} · {t.quantity} unit{t.quantity > 1 ? "s" : ""} · {t.technician}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(t.timestamp), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Critical equipment without spares</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {equipment.filter((e) => e.criticality === "Critical" && !spares.some((s) => s.equipmentSupported.includes(e.id))).slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.systemType} · {e.manufacturer} {e.model}</div>
                </div>
                <CriticalityBadge level={e.criticality} />
              </div>
            ))}
            {equipment.filter((e) => e.criticality === "Critical" && !spares.some((s) => s.equipmentSupported.includes(e.id))).length === 0 && (
              <div className="text-sm text-muted-foreground">All critical equipment has spare coverage.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Low and out-of-stock items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {spares.filter((s) => s.quantity < s.minStock).map((s) => (
            <Link key={s.id} to="/inventory/$id" params={{ id: s.id }} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/40">
              <div>
                <div className="text-sm font-medium">{s.partName}</div>
                <div className="text-xs text-muted-foreground">{s.manufacturer} · {s.modelNumber}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs tabular-nums text-muted-foreground">{s.quantity} / {s.minStock}</div>
                <StockBadge qty={s.quantity} min={s.minStock} />
                <CriticalityBadge level={s.criticality} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
