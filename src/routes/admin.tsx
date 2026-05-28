import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/StatusBadge";
import { useAuth, can } from "@/lib/auth";
import { config } from "@/lib/config";
import { SITES } from "@/lib/types";
import { ShieldOff, Plug, BarChart3, MessagesSquare, Database, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { role } = useAuth();
  if (!can(role, "users.manage")) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admin Settings" description={`Your role: ${role}`} />
        <Card className="p-10 text-center">
          <ShieldOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Admin role required.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Settings"
        description="Microsoft enterprise integration settings — placeholders ready for internal deployment."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard
          icon={Users}
          title="Sites"
          description="Sites used for scoping across the app."
        >
          <div className="flex flex-wrap gap-2">
            {SITES.map((s) => (
              <Badge key={s} tone="neutral">{s}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Add or rename sites in <code>src/lib/types.ts</code>.
          </p>
        </SettingsCard>

        <SettingsCard
          icon={Database}
          title="CMMS connection"
          description="Internal CMMS API endpoint for asset & work-order sync."
        >
          <Field label="CMMS API base URL" placeholder="https://cmms.contoso.example.com/api" envVar="CMMS_API_BASE_URL" />
          <Field label="CMMS client ID" placeholder="app-registration-id" envVar="CMMS_CLIENT_ID" />
          <Field label="CMMS client secret" placeholder="••••••••" envVar="CMMS_CLIENT_SECRET" type="password" />
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" disabled>Test connection</Button>
            <Button size="sm" disabled>Run manual sync</Button>
            <span className="text-xs text-muted-foreground">Last sync: never</span>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={BarChart3}
          title="Power BI"
          description="Workspace + report used for embedded analytics."
        >
          <Field label="Workspace ID" placeholder="00000000-0000-0000-0000-000000000000" envVar="POWERBI_WORKSPACE_ID" />
          <Field label="Report ID" placeholder="00000000-0000-0000-0000-000000000000" envVar="POWERBI_REPORT_ID" />
          <Button size="sm" variant="outline" disabled>Export reporting dataset</Button>
        </SettingsCard>

        <SettingsCard
          icon={MessagesSquare}
          title="Microsoft Teams notifications"
          description="Incoming webhook for stock & inspection alerts."
        >
          <Field label="Teams webhook URL" placeholder="https://outlook.office.com/webhook/…" envVar="TEAMS_WEBHOOK_URL" />
          <Button size="sm" variant="outline" disabled>Send test message</Button>
        </SettingsCard>

        <SettingsCard
          icon={Plug}
          title="Microsoft Entra ID (auth)"
          description="MSAL configuration — values are read from environment."
        >
          <Field label="Tenant ID" placeholder={config.entra.tenantId || "VITE_TENANT_ID"} envVar="VITE_TENANT_ID" />
          <Field label="Client ID" placeholder={config.entra.clientId || "VITE_CLIENT_ID"} envVar="VITE_CLIENT_ID" />
          <Field label="Redirect URI" placeholder={config.entra.redirectUri || "VITE_REDIRECT_URI"} envVar="VITE_REDIRECT_URI" />
        </SettingsCard>

        <SettingsCard
          icon={Users}
          title="Data retention"
          description="Audit & transaction history retention windows."
        >
          <Field label="Audit log retention (days)" placeholder="365" />
          <Field label="Transaction history retention (days)" placeholder="730" />
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon, title, description, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Field({ label, placeholder, envVar, type = "text" }: { label: string; placeholder?: string; envVar?: string; type?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {envVar && <code className="text-[10px] text-muted-foreground">{envVar}</code>}
      </div>
      <Input type={type} placeholder={placeholder} disabled />
    </div>
  );
}
