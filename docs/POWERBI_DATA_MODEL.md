# Power BI Data Model

A star schema designed to plug into the Dataverse / Azure SQL tables documented in `DATABASE_SCHEMA.md`.

## Fact tables

| Fact | Grain | Key measures |
|---|---|---|
| `Fact_InventoryTransactions` | one row per check-in / check-out / transfer | Qty Moved, Qty In, Qty Out |
| `Fact_InventorySnapshot` | daily snapshot per spare per site | On-Hand Qty, On-Hand Value, Below Min Stock flag |
| `Fact_Inspections` | one row per inspection event | Inspection Count, Pass Rate, Days to Next Due |
| `Fact_Reorders` | one row per reorder request | Open Reorders, Reorder Value, Lead Days |

## Dimension tables

- `Dim_Spare` (PartName, Manufacturer, Model, Category, Criticality, Condition, UnitCost)
- `Dim_Equipment` (Tag, Name, Manufacturer, Model, Category, Criticality)
- `Dim_Site` (SiteCode, Region) — CHI01 … CHI22, Other
- `Dim_Location` (Name, Building, Room, SiteCode)
- `Dim_Supplier` (Name, LeadTimeDays)
- `Dim_Date` (standard calendar with FiscalYear, FiscalQuarter, IsWeekend)
- `Dim_User` (DisplayName, Role)

## Report-ready views (export targets)

Each view is exposed by `/api/powerbi/export/{view}` for refresh into a PBI dataflow.

1. **Inventory by Site** — `Spare × Site → On-Hand Qty, On-Hand Value`
2. **Low Stock by Site** — same as above, filtered `quantity <= minStock`
3. **Out of Stock by Site** — `quantity = 0`
4. **Critical Asset Coverage** — equipment with criticality = Critical and count of linked spares (highlight zero)
5. **Inventory Transactions** — last 12 months of `Fact_InventoryTransactions`
6. **Inspection Compliance** — pass-rate trend, overdue counts by site
7. **Reorder Status** — open vs received reorders, average lead time
8. **Inventory Valuation** — on-hand value by site, by category, by criticality

## Embed flow

```
SPA → /api/powerbi/reports
        ↓ (server)
   Entra service principal → Power BI REST: GenerateToken
        ↓
   { reportId, embedUrl, accessToken } → powerbi-client-react <Report/>
```

## Recommended refresh

- `Fact_InventorySnapshot` — nightly (02:00 site-local)
- `Fact_InventoryTransactions`, `Fact_Reorders` — every 1h
- `Fact_Inspections` — every 4h
