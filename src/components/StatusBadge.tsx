import { cn } from "@/lib/utils";
import type { Criticality, Condition, ReorderStatus, InspectionStatus } from "@/lib/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-info/10 text-info border-info/30",
  primary: "bg-primary/10 text-primary border-primary/30",
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}

export function CriticalityBadge({ level }: { level: Criticality }) {
  const tone: Tone = level === "Critical" ? "danger" : level === "High" ? "warning" : level === "Medium" ? "info" : "neutral";
  return <Badge tone={tone}>{level}</Badge>;
}

export function StockBadge({ qty, min }: { qty: number; min: number }) {
  if (qty === 0) return <Badge tone="danger">Out of stock</Badge>;
  if (qty < min) return <Badge tone="warning">Low stock</Badge>;
  return <Badge tone="success">In stock</Badge>;
}

export function ConditionBadge({ condition }: { condition: Condition }) {
  const tone: Tone =
    condition === "New" || condition === "Good" ? "success" :
    condition === "Needs Inspection" ? "warning" :
    condition === "Damaged" ? "danger" : "neutral";
  return <Badge tone={tone}>{condition}</Badge>;
}

export function ReorderStatusBadge({ status }: { status: ReorderStatus }) {
  const tone: Tone =
    status === "Approved" || status === "Received" ? "success" :
    status === "Pending Approval" ? "warning" :
    status === "Cancelled" ? "danger" :
    status === "Ordered" ? "info" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const tone: Tone = status === "Pass" ? "success" : status === "Monitor" ? "warning" : status === "Replace" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
