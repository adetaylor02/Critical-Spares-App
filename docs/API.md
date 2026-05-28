# API Reference

Base path: `/api/v1` (placeholder — currently mounted at `/api`).

All endpoints currently return **HTTP 501** with a JSON body indicating the placeholder status. They define the surface for the internal Microsoft team to implement against Azure SQL / Dataverse / CMMS.

## Authentication

Every route should be protected by Entra ID JWT validation in a server middleware. Group claims map to roles per `src/lib/integrations/entra.ts`.

## Resources

| Method | Path | Description | Min role |
|---|---|---|---|
| GET / POST | `/api/spares` | List / create spares | Viewer / Manager |
| GET / POST | `/api/equipment` | List / create equipment | Viewer / Manager |
| GET / POST | `/api/transactions` | List / record check-in/out | Viewer / Technician |
| GET / POST | `/api/reorders` | List / create reorders | Viewer / Manager |
| GET / POST | `/api/inspections` | List / record inspections | Viewer / Technician |
| GET / POST | `/api/suppliers` | List / create suppliers | Viewer / Manager |
| GET / POST | `/api/locations` | List / create locations | Viewer / Manager |
| GET | `/api/audit-logs` | Read audit trail | Manager |
| GET | `/api/notifications` | Active alerts | Viewer |
| POST | `/api/notifications/teams` | Server-side Teams webhook proxy | Server-only |
| POST | `/api/import` | Bulk Excel import | Manager |
| GET | `/api/reports` | List report metadata | Viewer |
| GET | `/api/cmms/assets` | Pull CMMS assets | Viewer |
| GET / POST | `/api/cmms/work-orders` | List / link work orders | Technician |
| GET | `/api/powerbi/reports` | Embed token + IDs | Viewer |

## Common query params

- `site` — restrict to a site code (CHI01 / … / Other). Omit for all sites.
- `q` — free-text search.
- `limit`, `cursor` — pagination.

## Error shape

```json
{ "ok": false, "code": "string", "message": "string", "details": {} }
```
