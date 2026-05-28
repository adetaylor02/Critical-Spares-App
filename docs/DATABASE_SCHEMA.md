# Database Schema — Dataverse / Azure SQL Mapping

All tables target either Azure SQL or Microsoft Dataverse. Field names follow Dataverse logical-name conventions (`cs_*`); for Azure SQL strip the prefix. Standard fields (`id`, `createdAt`, `updatedAt`, `createdBy`, `modifiedBy`) are present on every table and omitted below.

## SpareParts (`cs_spareparts`)

| Field | Type | Required | Notes / Relationship | Example |
|---|---|---|---|---|
| partName | string(120) | yes | | "UPS Battery Module 12V/9Ah" |
| description | string(500) | no | | "VRLA battery" |
| manufacturer | string(120) | yes | | "Schneider Electric" |
| modelNumber | string(80) | yes | unique with manufacturer | "GVSBT9" |
| serialNumber | string(80) | no | | "SN-0001" |
| category | choice | yes | UPS · PDU · Switchgear · … | "UPS" |
| criticality | choice | yes | Critical · High · Medium · Low | "Critical" |
| condition | choice | yes | New · Good · Needs Inspection · Damaged · Obsolete | "Good" |
| minStock | int | yes | reorder threshold | 20 |
| quantity | int | yes | | 8 |
| unitCost | decimal(12,2) | yes | USD | 185.00 |
| leadTimeDays | int | yes | | 14 |
| expiryDate | date | no | | 2027-04-01 |
| site | lookup → Sites | yes | one of CHI01..CHI22 / Other | "CHI05" |
| location | lookup → Locations | yes | | "loc-2" |
| bin | string(40) | no | | "Shelf B-12" |
| supplier | lookup → Suppliers | yes | | "sup-1" |
| notes | string(2000) | no | | |

## EquipmentAssets (`cs_equipmentassets`)

| Field | Type | Required | Notes | Example |
|---|---|---|---|---|
| tag | string(40) | yes | unique | "UPS-CHI05-01" |
| name | string(120) | yes | | "UPS Module A" |
| manufacturer | string(120) | yes | | "Eaton" |
| model | string(120) | yes | | "93PM-200" |
| category | choice | yes | matches SpareParts.category | "UPS" |
| criticality | choice | yes | | "Critical" |
| site | lookup → Sites | yes | | "CHI05" |
| location | lookup → Locations | yes | | "loc-1" |
| installDate | date | no | | 2022-06-12 |

## SpareEquipmentLinks (`cs_spareequipmentlinks`)

Many-to-many junction.

| Field | Type | Required | Example |
|---|---|---|---|
| spareId | lookup → SpareParts | yes | |
| equipmentId | lookup → EquipmentAssets | yes | |

## InventoryTransactions (`cs_inventorytransactions`)

| Field | Type | Required | Notes | Example |
|---|---|---|---|---|
| type | choice | yes | check-in · check-out · transfer | "check-out" |
| spareId | lookup → SpareParts | yes | | |
| quantity | int | yes | | 2 |
| technician | string(120) | yes | | "alex.morris" |
| workOrder | string(60) | no | CMMS WO id | "WO-44210" |
| assetId | lookup → EquipmentAssets | no | | |
| fromLocation | lookup → Locations | no | transfer only | |
| toLocation | lookup → Locations | no | transfer/check-in | |
| condition | choice | no | check-in only | "Good" |
| reason | string(500) | no | | |
| site | lookup → Sites | yes | denormalised | "CHI05" |
| timestamp | datetime | yes | server-set | |

## ReorderRequests (`cs_reorderrequests`)

| Field | Type | Required | Notes | Example |
|---|---|---|---|---|
| spareId | lookup → SpareParts | yes | | |
| quantity | int | yes | | 30 |
| supplier | lookup → Suppliers | yes | | |
| status | choice | yes | Draft · Pending Approval · Approved · Ordered · Received · Cancelled | "Pending Approval" |
| requestedBy | string(120) | yes | | |
| approvedBy | string(120) | no | | |
| eta | date | no | | |
| site | lookup → Sites | yes | | |
| notes | string(2000) | no | | |

## Inspections (`cs_inspections`)

| Field | Type | Required | Notes | Example |
|---|---|---|---|---|
| spareId | lookup → SpareParts | yes | | |
| inspector | string(120) | yes | | |
| status | choice | yes | Pass · Monitor · Replace · Obsolete | "Pass" |
| date | date | yes | | |
| nextDue | date | no | | |
| site | lookup → Sites | yes | | |
| notes | string(2000) | no | | |

## Suppliers (`cs_suppliers`)

| Field | Type | Required | Example |
|---|---|---|---|
| name | string(160) | yes | "Schneider Electric" |
| contact | string(120) | no | "K. Wallace" |
| email | string(160) | no | |
| phone | string(40) | no | |
| leadTimeDays | int | yes | 14 |

## Locations (`cs_locations`)

| Field | Type | Required | Example |
|---|---|---|---|
| name | string(120) | yes | "Stockroom A" |
| building | string(120) | yes | "MMR-1" |
| room | string(60) | yes | "B-12" |
| site | lookup → Sites | yes | "CHI05" |

## Documents (`cs_documents`)

| Field | Type | Required | Notes | Example |
|---|---|---|---|---|
| spareId | lookup → SpareParts | yes | | |
| name | string(200) | yes | | "datasheet.pdf" |
| url | string(2000) | yes | SharePoint / Blob URL | |
| kind | choice | no | datasheet · manual · cert · photo | "datasheet" |

## Notifications (`cs_notifications`)

Derived view in the app — when materialised in Dataverse use:

| Field | Type | Required | Example |
|---|---|---|---|
| type | choice | yes | low-stock · out-of-stock · reorder · inspection · expiry · coverage |
| severity | choice | yes | info · warning · critical |
| message | string(500) | yes | |
| entityId | string(60) | no | |
| site | lookup → Sites | yes | |
| acknowledged | bool | yes | default false |

## AuditLogs (`cs_auditlogs`)

| Field | Type | Required | Example |
|---|---|---|---|
| timestamp | datetime | yes | |
| user | string(160) | yes | |
| site | lookup → Sites | no | |
| action | string(80) | yes | "spare.checked-out" |
| entity | string(40) | yes | "spare" |
| entityId | string(60) | yes | |
| oldValue | string(4000) | no | JSON |
| newValue | string(4000) | no | JSON |
| notes | string(2000) | no | |

## Users (`cs_users`)

Managed in Entra ID — mirrored in Dataverse only if profile metadata is required.

| Field | Type | Required | Example |
|---|---|---|---|
| entraObjectId | guid | yes | |
| email | string(160) | yes | |
| displayName | string(160) | yes | |

## UserRoles (`cs_userroles`)

Source of truth = Entra ID group membership. Materialise for query performance.

| Field | Type | Required | Example |
|---|---|---|---|
| userId | lookup → Users | yes | |
| role | choice | yes | Admin · Manager · Technician · Viewer |
| entraGroupId | guid | yes | |
