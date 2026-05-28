# Deployment Guide — Microsoft Internal

This document describes how to promote Critical Spares Manager from the Lovable preview into an approved Microsoft enterprise environment.

## 1. Microsoft Entra ID (auth)

1. **App registration** → Entra admin center → *App registrations* → *New*.
2. Platform: *Single-page application*. Redirect URI: `https://<your-host>/auth/callback`.
3. API permissions: `User.Read` (delegated). Add **group claims** (Security groups → Group ID).
4. Create four security groups and assign users:
   - `CriticalSpares_Admins`
   - `CriticalSpares_Managers`
   - `CriticalSpares_Technicians`
   - `CriticalSpares_Viewers`
5. Copy **Tenant ID** and **Application (client) ID** into the App Service configuration as `VITE_TENANT_ID` and `VITE_CLIENT_ID`.
6. In code, swap `src/lib/auth.tsx` for an MSAL-backed provider using `src/lib/integrations/entra.ts` (`msalConfig`, `loginRequest`, `rolesFromEntraGroups`).

## 2. Azure App Service (recommended) or Static Web Apps

### App Service (Node 20 Linux)

```bash
az group create -n rg-critical-spares -l westus2
az appservice plan create -g rg-critical-spares -n plan-cs -sku P1v3 --is-linux
az webapp create -g rg-critical-spares -p plan-cs -n app-critical-spares --runtime "NODE:20-lts"
az webapp config appsettings set -g rg-critical-spares -n app-critical-spares --settings @appsettings.json
```

Build & deploy:
```bash
bun install
bun run build
az webapp deploy -g rg-critical-spares -n app-critical-spares --src-path dist.zip --type zip
```

### Static Web Apps (alternative — static + Azure Functions API)

```bash
az staticwebapp create -n swa-critical-spares -g rg-critical-spares \
  --source . --branch main --app-location "/" --output-location "dist"
```

## 3. Database — Azure SQL **or** Dataverse

### Azure SQL
1. Provision: `az sql server create … ; az sql db create …`.
2. Use Entra-only authentication. Set `AZURE_SQL_CONNECTION_STRING` with `Authentication=Active Directory Default`.
3. Run the DDL derived from `docs/DATABASE_SCHEMA.md`.
4. Implement the `/api/*` server routes to query SQL (Tedious / mssql in server functions).

### Dataverse
1. In Power Platform admin centre, create a solution `CriticalSparesManager`.
2. Create tables matching `docs/DATABASE_SCHEMA.md`. Use the documented column names.
3. Set `DATAVERSE_ENVIRONMENT_URL`.
4. Implement `/api/*` routes against the Dataverse Web API using on-behalf-of flow.

## 4. Power BI

1. Create a workspace; capture `POWERBI_WORKSPACE_ID`.
2. Publish reports for the views listed in `docs/POWERBI_DATA_MODEL.md`. Capture `POWERBI_REPORT_ID`.
3. Service principal access: grant the Entra app **Workspace.Read.All** + **Report.Read.All**.
4. The `/api/powerbi/reports` route already returns the configured IDs; extend it to mint an embed token using the PBI REST API.

## 5. Power Automate

Import the flows defined in `docs/POWER_AUTOMATE_FLOWS.md`. Each flow's trigger points at a row in the chosen data store (SQL trigger or Dataverse table).

## 6. Microsoft Teams

Add an *Incoming Webhook* to the Operations channel, copy the URL into `TEAMS_WEBHOOK_URL` (App Service configuration / Key Vault reference). The route `src/routes/api/notifications.teams.ts` already calls the webhook server-side.

## 7. Required environment variables

See `.env.example`. Store secret values (Azure SQL, CMMS client secret, Teams webhook) in **Azure Key Vault** and reference them via `@Microsoft.KeyVault(...)` in App Service settings.

## 8. Build & deploy checklist

- [ ] Entra app registration + group claims configured
- [ ] Environment variables set in App Service / SWA
- [ ] Database schema deployed (Azure SQL / Dataverse)
- [ ] `src/lib/services/*` swapped from mock store to `/api/*` calls
- [ ] `src/lib/auth.tsx` swapped to MSAL provider
- [ ] Power BI reports published & embed permissions granted
- [ ] Power Automate flows imported
- [ ] Teams webhook configured
- [ ] CMMS API endpoint + credentials configured
- [ ] Security review completed (Entra scopes, DLP, audit retention)
