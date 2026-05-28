export type SystemCategory =
  | "UPS"
  | "PDU"
  | "Switchgear"
  | "Generator"
  | "ATS"
  | "Chiller"
  | "CRAH"
  | "Fire Alarm"
  | "BMS"
  | "Controls"
  | "Network"
  | "Other";

export type Criticality = "Critical" | "High" | "Medium" | "Low";
export type Condition = "New" | "Good" | "Needs Inspection" | "Damaged" | "Obsolete";

export const SITES = ["CHI01", "CHI02", "CHI05", "CHI06", "CHI07", "CHI10", "CHI22", "Other"] as const;
export type Site = typeof SITES[number];
export type SiteScope = "All CHI Metro" | Site;

export type ReorderStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Ordered"
  | "Received"
  | "Cancelled";
export type InspectionStatus = "Pass" | "Monitor" | "Replace" | "Obsolete";
export type Role = "Admin" | "Manager" | "Technician" | "Viewer";

export interface SparePart {
  site: Site;
  id: string;
  partName: string;
  description: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber?: string;
  equipmentSupported: string[]; // asset ids
  category: SystemCategory;
  criticality: Criticality;
  minStock: number;
  quantity: number;
  unitCost: number;
  location: string; // location id
  bin: string;
  supplier: string; // supplier id
  leadTimeDays: number;
  lastUsed?: string;
  lastInspected?: string;
  expiryDate?: string;
  condition: Condition;
  notes?: string;
  documents: Document[];
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: "datasheet" | "photo" | "manual" | "invoice" | "certificate" | "other";
  uploadedAt: string;
}

export interface EquipmentAsset {
  id: string;
  site: Site;
  name: string;
  systemType: SystemCategory;
  location: string;
  manufacturer: string;
  model: string;
  criticality: Criticality;
}

export interface InventoryTransaction {
  id: string;
  site?: Site;
  type: "check-in" | "check-out" | "transfer";
  spareId: string;
  quantity: number;
  technician: string;
  workOrder?: string;
  assetId?: string;
  reason?: string;
  condition?: Condition;
  fromLocation?: string;
  toLocation?: string;
  timestamp: string;
}

export interface ReorderRequest {
  id: string;
  site?: Site;
  spareId: string;
  quantity: number;
  reason: string;
  supplier: string;
  estimatedCost: number;
  requiredBy: string;
  requestedBy: string;
  status: ReorderStatus;
  createdAt: string;
}

export interface Inspection {
  id: string;
  site?: Site;
  spareId: string;
  inspectionDate: string;
  inspector: string;
  condition: Condition;
  findings: string;
  status: InspectionStatus;
  nextDue: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  leadTimeDays: number;
}

export interface Location {
  id: string;
  site: Site;
  name: string;
  building: string;
  room: string;
}

export interface AuditLog {
  id: string;
  site?: Site;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  details?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: "low-stock" | "out-of-stock" | "reorder" | "inspection" | "expiry" | "coverage";
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  read: boolean;
}
