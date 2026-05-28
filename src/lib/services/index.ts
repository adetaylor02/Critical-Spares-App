/**
 * Service layer — decouples UI from the underlying data source.
 *
 * Today these wrap the in-browser Zustand store (mock data).
 * For Microsoft internal deployment, swap each module's
 * implementation for calls to /api/* (Azure SQL, Dataverse, or
 * an internal REST gateway) without touching UI components.
 */
export * from "./sparePartsService";
export * from "./equipmentService";
export * from "./inventoryTransactionService";
export * from "./reorderService";
export * from "./inspectionService";
export * from "./supplierService";
export * from "./locationService";
export * from "./auditLogService";
export * from "./notificationService";
export * from "./userRoleService";
export * from "./reportsService";
export * from "./cmmsSyncService";
