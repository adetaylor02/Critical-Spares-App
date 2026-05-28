import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const role = useApp((s) => s.role);
  const user = useApp((s) => s.currentUser);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Workspace preferences" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Name: </span>{user}</div>
            <div><span className="text-muted-foreground">Role: </span>{role}</div>
            <div><span className="text-muted-foreground">Org: </span>Critical Operations · DC-01</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notification thresholds</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Low stock alert when quantity is below minimum stock level.</p>
            <p>• Out-of-stock alert when quantity reaches zero.</p>
            <p>• Expiring alert within 120 days of expiry date.</p>
            <p>• Coverage alert when a Critical asset has no assigned spare.</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Backend</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>This demo runs entirely in-browser using realistic sample data and in-memory state. Enable <strong>Lovable Cloud</strong> to persist inventory, authenticate real users with role-based access, and upload documents.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
