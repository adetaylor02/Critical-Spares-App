# Power Automate Flows — Recommended Catalogue

Each flow triggers from the chosen data store (Azure SQL via *When an item is created/modified* connector, or Dataverse table triggers). Replace `{ENV}` with the environment URL.

## 1. Low-stock alert
- **Trigger**: SpareParts row modified where `quantity <= minStock` AND `quantity > 0`.
- **Condition**: previous quantity > minStock (only fire on transition).
- **Action**: Post adaptive card to Teams Ops channel; create row in Notifications.
- **Fields**: `partName`, `modelNumber`, `site`, `location`, `quantity`, `minStock`.

## 2. Out-of-stock alert
- **Trigger**: SpareParts row modified where `quantity = 0`.
- **Condition**: criticality in {Critical, High}.
- **Action**: Post Teams card *and* email the supplier contact; create urgent Notification.
- **Fields**: `partName`, `modelNumber`, `site`, `supplier.email`.

## 3. Reorder approval
- **Trigger**: ReorderRequests row created with `status = Pending Approval`.
- **Condition**: `unitCost * quantity > $5,000` → route to Manager approval.
- **Action**: Send Approval (Teams). On approve → set status `Approved`; on reject → `Cancelled`.
- **Fields**: `spareId`, `quantity`, `supplier`, `site`, `requestedBy`.

## 4. Inspection overdue reminder
- **Trigger**: Daily 06:00 (Recurrence).
- **Condition**: Inspections with `nextDue <= today() + 14 days` AND no newer inspection.
- **Action**: Email assigned technician group; post weekly digest to Teams.
- **Fields**: `spareId`, `site`, `nextDue`, `inspector`.

## 5. Spare checkout notification
- **Trigger**: InventoryTransactions row created with `type = check-out`.
- **Condition**: spare's criticality = Critical.
- **Action**: Post to Teams Ops channel.
- **Fields**: `spareId`, `quantity`, `technician`, `workOrder`, `site`.

## 6. Spare import completed notification
- **Trigger**: AuditLogs row created with `action = import.completed`.
- **Action**: Post summary card to Teams with imported / updated / skipped counts and batch ID.
- **Fields**: `notes` (contains batch id + counts).

## 7. Critical asset with no spare alert
- **Trigger**: EquipmentAssets row created/modified.
- **Condition**: criticality = Critical AND no SpareEquipmentLinks rows for `equipmentId`.
- **Action**: Email Manager group; create Notification of type `coverage`.
- **Fields**: `tag`, `name`, `site`, `location`.
