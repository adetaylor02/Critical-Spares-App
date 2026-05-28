# Critical Spares Manager

A web application for managing, tracking, and auditing critical spare parts in data center / mission-critical environments. Built as a deployment-ready prototype that can be promoted into a Microsoft enterprise environment with minimal refactoring.

## Status

**Migration-ready, not production-connected.** The app runs locally on mock / sample data through Lovable Cloud. All Microsoft integration points are scaffolded as services + placeholder API routes, ready to be swapped for internal endpoints, credentials, and security review.

## Features

- Dashboard with clickable cards & charts (drill into low-stock, out-of-stock, expiring, inspections-due, reorders, uncovered assets)
- Spare inventory: search, filter, detail pages, QR codes
- Check-in / check-out / transfer workflows
- Reorder management with approval lifecycle
- Equipment mapping & critical-asset coverage
- Inspections & inspection compliance
- Bulk Excel import (template download, validation, duplicate handling, batch ID, audit trail)
- Reports (with Power BI placeholders)
- Role-based access (Admin / Manager / Technician / Viewer)
- Notifications & full audit trail
- **Global site selector** (All CHI Metro · CHI01 · CHI02 · CHI05 · CHI06 · CHI07 · CHI10 · CHI22 · Other) scoping dashboard, inventory, reports, inspections, reorders, equipment, audit, notifications

## Architecture

```
src/
├── routes/                       # TanStack Router file-based pages + /api routes
│   ├── api/                      # Placeholder REST endpoints (Azure SQL/Dataverse/CMMS targets)
│   ├── admin.tsx                 # Admin settings page (CMMS, Power BI, Teams, Entra)
│   └── ...                       # Dashboard, inventory, reorders, …
├── lib/
│   ├── config.ts                 # Reads VITE_* env config
│   ├── store.ts                  # Zustand store (mock data layer)
│   ├── auth.tsx                  # Auth provider (Lovable Cloud today, MSAL-ready)
│   ├── services/                 # Service layer — UI calls these, not the store directly
│   │   ├── sparePartsService.ts
│   │   ├── equipmentService.ts
│   │   ├── inventoryTransactionService.ts
│   │   ├── reorderService.ts
│   │   ├── inspectionService.ts
│   │   ├── supplierService.ts
│   │   ├── locationService.ts
│   │   ├── auditLogService.ts
│   │   ├── notificationService.ts
│   │   └── userRoleService.ts
│   └── integrations/             # Microsoft integration stubs
│       ├── entra.ts              # MSAL config + Entra group → role mapping
│       ├── cmms.ts               # CMMS asset / work-order sync
│       ├── teams.ts              # Teams webhook notifications
│       └── powerbi.ts            # Power BI embed token exchange
├── components/                   # Shared UI (sidebar, top bar, site selector, dialogs)
└── styles.css                    # Design tokens (semantic CSS variables)

docs/
├── DEPLOYMENT.md                 # Azure deployment guide
├── DATABASE_SCHEMA.md            # Dataverse / Azure SQL field mapping
├── POWER_AUTOMATE_FLOWS.md       # Recommended Power Automate flows
└── POWERBI_DATA_MODEL.md         # Star schema for reporting
```

## Local setup

```bash
bun install
cp .env.example .env       # fill in for local; leave VITE_TENANT_ID/CLIENT_ID blank to keep mock auth
bun run dev
```

## Microsoft integration roadmap

| Capability | Today | Migration step |
|---|---|---|
| Auth | Lovable Cloud + roles table | Wire `@azure/msal-react` using `src/lib/integrations/entra.ts`; map group claims via `ENTRA_GROUP_TO_ROLE` |
| Data | In-browser Zustand store | Replace each service in `src/lib/services/` with `fetch('/api/…')` to the Azure SQL or Dataverse-backed handlers |
| Notifications | In-app notifications panel | `src/routes/api/notifications.teams.ts` already posts to `TEAMS_WEBHOOK_URL` server-side |
| Reporting | Recharts + CSV export | Embed Power BI via `src/lib/integrations/powerbi.ts` + `/api/powerbi/reports` |
| CMMS | Service stubs only | Implement `/api/cmms/*` routes against the internal CMMS gateway |
| Workflows | None | Define Power Automate flows per `docs/POWER_AUTOMATE_FLOWS.md` |

## Known placeholders

All files under `src/routes/api/` return HTTP 501. `src/lib/integrations/*` modules are typed stubs. `src/routes/admin.tsx` inputs are read-only previews of the env vars expected at runtime.

## Next steps for internal deployment

1. Register the SPA in Microsoft Entra ID and populate `.env`.
2. Provision Azure SQL **or** create a Dataverse solution from `docs/DATABASE_SCHEMA.md`.
3. Replace one service at a time (start with `sparePartsService`) to call `/api/spares`.
4. Stand up Power Automate flows from the catalogue.
5. Connect Power BI workspace, publish embed-ready reports.
6. Configure Teams webhook for the operations channel.
7. Security review (Entra app permissions, RLS / DLP, secret handling).
