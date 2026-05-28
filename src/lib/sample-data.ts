import type {
  SparePart,
  EquipmentAsset,
  InventoryTransaction,
  ReorderRequest,
  Inspection,
  Supplier,
  Location,
  AuditLog,
  Notification,
  Site,
} from "./types";

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "Schneider Electric", contact: "Anna Kim", email: "anna@se.com", phone: "+1 555 0101", leadTimeDays: 14 },
  { id: "sup-2", name: "Vertiv", contact: "Mark Reyes", email: "mark@vertiv.com", phone: "+1 555 0102", leadTimeDays: 21 },
  { id: "sup-3", name: "Eaton", contact: "Priya Shah", email: "priya@eaton.com", phone: "+1 555 0103", leadTimeDays: 10 },
  { id: "sup-4", name: "Caterpillar", contact: "John Doe", email: "john@cat.com", phone: "+1 555 0104", leadTimeDays: 30 },
  { id: "sup-5", name: "Cisco", contact: "Lin Wu", email: "lin@cisco.com", phone: "+1 555 0105", leadTimeDays: 7 },
];

export const locations: Location[] = [
  { id: "loc-1", site: "CHI05", name: "Main Storeroom A", building: "DC-01", room: "Storage A101" },
  { id: "loc-2", site: "CHI05", name: "UPS Room", building: "DC-01", room: "ELEC-201" },
  { id: "loc-3", site: "CHI06", name: "Generator Yard Storage", building: "DC-01", room: "GEN-OUT" },
  { id: "loc-4", site: "CHI06", name: "Mechanical Storeroom", building: "DC-02", room: "MECH-105" },
  { id: "loc-5", site: "CHI10", name: "Network Cage", building: "DC-01", room: "NET-301" },
  { id: "loc-6", site: "CHI01", name: "Electrical Storage", building: "DC-A", room: "ELEC-110" },
  { id: "loc-7", site: "CHI02", name: "Critical Spares Vault", building: "DC-B", room: "VLT-1" },
  { id: "loc-8", site: "CHI07", name: "Mechanical Yard", building: "DC-C", room: "YRD-2" },
  { id: "loc-9", site: "CHI22", name: "Cold Storage", building: "DC-D", room: "COLD-1" },
];

export const equipment: EquipmentAsset[] = [
  { id: "eq-1", site: "CHI05", name: "UPS-A1 (750kVA)", systemType: "UPS", location: "loc-2", manufacturer: "Schneider Electric", model: "Galaxy VX", criticality: "Critical" },
  { id: "eq-2", site: "CHI05", name: "UPS-A2 (750kVA)", systemType: "UPS", location: "loc-2", manufacturer: "Schneider Electric", model: "Galaxy VX", criticality: "Critical" },
  { id: "eq-3", site: "CHI05", name: "PDU-1A", systemType: "PDU", location: "loc-2", manufacturer: "Vertiv", model: "Liebert FPC", criticality: "High" },
  { id: "eq-4", site: "CHI06", name: "Generator G1 (2MW)", systemType: "Generator", location: "loc-3", manufacturer: "Caterpillar", model: "C175-20", criticality: "Critical" },
  { id: "eq-5", site: "CHI05", name: "ATS-1", systemType: "ATS", location: "loc-2", manufacturer: "ASCO", model: "7000 Series", criticality: "Critical" },
  { id: "eq-6", site: "CHI06", name: "Chiller CH-01", systemType: "Chiller", location: "loc-4", manufacturer: "Carrier", model: "AquaForce 30XV", criticality: "Critical" },
  { id: "eq-7", site: "CHI06", name: "CRAH Unit-12", systemType: "CRAH", location: "loc-4", manufacturer: "Vertiv", model: "Liebert CW", criticality: "High" },
  { id: "eq-8", site: "CHI01", name: "Switchgear SG-MV1", systemType: "Switchgear", location: "loc-6", manufacturer: "Eaton", model: "VCP-W", criticality: "Critical" },
  { id: "eq-9", site: "CHI10", name: "Core Switch CS-01", systemType: "Network", location: "loc-5", manufacturer: "Cisco", model: "Nexus 9508", criticality: "Critical" },
  { id: "eq-10", site: "CHI06", name: "Fire Panel FA-1", systemType: "Fire Alarm", location: "loc-4", manufacturer: "Siemens", model: "Cerberus PRO", criticality: "High" },
  { id: "eq-11", site: "CHI02", name: "UPS-B1 (500kVA)", systemType: "UPS", location: "loc-7", manufacturer: "Eaton", model: "9395P", criticality: "Critical" },
  { id: "eq-12", site: "CHI07", name: "Generator G2 (2MW)", systemType: "Generator", location: "loc-8", manufacturer: "Caterpillar", model: "C175-20", criticality: "Critical" },
  { id: "eq-13", site: "CHI22", name: "Chiller CH-22", systemType: "Chiller", location: "loc-9", manufacturer: "Carrier", model: "AquaForce 30XV", criticality: "Critical" },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();

const mk = (s: Omit<SparePart, "documents"> & { documents?: SparePart["documents"] }): SparePart =>
  ({ documents: [], ...s });

export const spareParts: SparePart[] = [
  mk({ id: "sp-1", site: "CHI05", partName: "UPS Battery Module 12V/9Ah", description: "VRLA sealed lead-acid battery module for Galaxy VX strings", manufacturer: "Schneider Electric", modelNumber: "GVSBT9", serialNumber: "SN-BTM-00921", equipmentSupported: ["eq-1", "eq-2"], category: "UPS", criticality: "Critical", minStock: 20, quantity: 8, unitCost: 185, location: "loc-2", bin: "Shelf B-12", supplier: "sup-1", leadTimeDays: 14, lastUsed: daysAgo(12), lastInspected: daysAgo(45), expiryDate: daysAhead(540), condition: "Good", createdAt: daysAgo(420) }),
  mk({ id: "sp-2", site: "CHI05", partName: "UPS Cooling Fan Assembly", description: "Internal cooling fan with bracket for Galaxy VX cabinet", manufacturer: "Schneider Electric", modelNumber: "GVFAN-220", equipmentSupported: ["eq-1", "eq-2"], category: "UPS", criticality: "High", minStock: 4, quantity: 6, unitCost: 320, location: "loc-2", bin: "Shelf B-14", supplier: "sup-1", leadTimeDays: 10, lastInspected: daysAgo(20), condition: "New", createdAt: daysAgo(300) }),
  mk({ id: "sp-3", site: "CHI05", partName: "PDU Breaker 60A 3-pole", description: "Molded case circuit breaker for Liebert FPC PDU", manufacturer: "Vertiv", modelNumber: "MCCB-60A-3P", equipmentSupported: ["eq-3"], category: "PDU", criticality: "High", minStock: 6, quantity: 11, unitCost: 240, location: "loc-1", bin: "Cabinet C-3", supplier: "sup-2", leadTimeDays: 21, condition: "New", createdAt: daysAgo(200) }),
  mk({ id: "sp-4", site: "CHI06", partName: "Generator Fuel Filter", description: "Primary fuel filter for CAT C175-20 diesel generator", manufacturer: "Caterpillar", modelNumber: "1R-1804", equipmentSupported: ["eq-4"], category: "Generator", criticality: "Critical", minStock: 8, quantity: 0, unitCost: 95, location: "loc-3", bin: "Bin G-1", supplier: "sup-4", leadTimeDays: 30, lastUsed: daysAgo(60), condition: "New", createdAt: daysAgo(500) }),
  mk({ id: "sp-5", site: "CHI06", partName: "Generator Oil Filter", description: "Engine oil filter for CAT C175-20", manufacturer: "Caterpillar", modelNumber: "1R-1808", equipmentSupported: ["eq-4"], category: "Generator", criticality: "High", minStock: 6, quantity: 9, unitCost: 78, location: "loc-3", bin: "Bin G-2", supplier: "sup-4", leadTimeDays: 30, condition: "New", createdAt: daysAgo(500) }),
  mk({ id: "sp-6", site: "CHI05", partName: "ATS Controller Module", description: "Group 7 controller board for ASCO 7000 series ATS", manufacturer: "ASCO", modelNumber: "G7-CTRL", equipmentSupported: ["eq-5"], category: "ATS", criticality: "Critical", minStock: 2, quantity: 1, unitCost: 4200, location: "loc-1", bin: "Secure Cab S-1", supplier: "sup-3", leadTimeDays: 28, lastInspected: daysAgo(120), condition: "Needs Inspection", createdAt: daysAgo(700) }),
  mk({ id: "sp-7", site: "CHI01", partName: "MV Switchgear Protection Relay", description: "SEL-751 feeder protection relay for SG-MV1", manufacturer: "Schweitzer", modelNumber: "SEL-751", equipmentSupported: ["eq-8"], category: "Switchgear", criticality: "Critical", minStock: 2, quantity: 3, unitCost: 3100, location: "loc-6", bin: "Secure Cab S-2", supplier: "sup-3", leadTimeDays: 21, lastInspected: daysAgo(15), condition: "Good", createdAt: daysAgo(600) }),
  mk({ id: "sp-8", site: "CHI06", partName: "BMS Temperature Sensor", description: "Modbus RTU temperature sensor for BMS field network", manufacturer: "Siemens", modelNumber: "QAE2120.010", equipmentSupported: [], category: "BMS", criticality: "Medium", minStock: 10, quantity: 24, unitCost: 65, location: "loc-4", bin: "Drawer D-7", supplier: "sup-2", leadTimeDays: 14, condition: "New", createdAt: daysAgo(150) }),
  mk({ id: "sp-9", site: "CHI06", partName: "CRAH Fan Belt", description: "V-belt for Vertiv Liebert CW CRAH unit", manufacturer: "Vertiv", modelNumber: "BLT-CW-22", equipmentSupported: ["eq-7"], category: "CRAH", criticality: "Medium", minStock: 12, quantity: 4, unitCost: 32, location: "loc-4", bin: "Shelf M-3", supplier: "sup-2", leadTimeDays: 7, lastUsed: daysAgo(8), condition: "Good", createdAt: daysAgo(180) }),
  mk({ id: "sp-10", site: "CHI10", partName: "10G SFP+ SR Transceiver", description: "Multi-mode 10GBASE-SR transceiver, LC connector", manufacturer: "Cisco", modelNumber: "SFP-10G-SR", equipmentSupported: ["eq-9"], category: "Network", criticality: "High", minStock: 20, quantity: 32, unitCost: 280, location: "loc-5", bin: "Drawer N-2", supplier: "sup-5", leadTimeDays: 7, condition: "New", createdAt: daysAgo(90) }),
  mk({ id: "sp-11", site: "CHI06", partName: "Fire Alarm Smoke Detector Module", description: "Addressable photoelectric smoke detector for Cerberus PRO", manufacturer: "Siemens", modelNumber: "OP720", equipmentSupported: ["eq-10"], category: "Fire Alarm", criticality: "Critical", minStock: 15, quantity: 18, unitCost: 145, location: "loc-4", bin: "Cabinet F-1", supplier: "sup-2", leadTimeDays: 14, lastInspected: daysAgo(30), condition: "Good", createdAt: daysAgo(250) }),
  mk({ id: "sp-12", site: "CHI06", partName: "Chiller Compressor Oil", description: "POE refrigeration oil 5L for Carrier 30XV", manufacturer: "Carrier", modelNumber: "PP47-32", equipmentSupported: ["eq-6"], category: "Chiller", criticality: "Medium", minStock: 6, quantity: 2, unitCost: 110, location: "loc-4", bin: "Shelf M-7", supplier: "sup-2", leadTimeDays: 14, expiryDate: daysAhead(90), condition: "Good", createdAt: daysAgo(220) }),
  mk({ id: "sp-13", site: "CHI02", partName: "UPS Power Module 9395P", description: "Hot-swappable power module for Eaton 9395P", manufacturer: "Eaton", modelNumber: "9395P-PM", equipmentSupported: ["eq-11"], category: "UPS", criticality: "Critical", minStock: 2, quantity: 2, unitCost: 8500, location: "loc-7", bin: "Vault V-1", supplier: "sup-3", leadTimeDays: 21, condition: "New", createdAt: daysAgo(120) }),
  mk({ id: "sp-14", site: "CHI07", partName: "Generator Air Filter", description: "Engine air filter for CAT C175-20", manufacturer: "Caterpillar", modelNumber: "1R-0716", equipmentSupported: ["eq-12"], category: "Generator", criticality: "High", minStock: 4, quantity: 1, unitCost: 145, location: "loc-8", bin: "Bin Y-3", supplier: "sup-4", leadTimeDays: 30, condition: "Good", createdAt: daysAgo(180) }),
  mk({ id: "sp-15", site: "CHI22", partName: "Chiller Pressure Sensor", description: "High-side pressure transducer for AquaForce 30XV", manufacturer: "Carrier", modelNumber: "HK05ZB001", equipmentSupported: ["eq-13"], category: "Chiller", criticality: "High", minStock: 4, quantity: 5, unitCost: 320, location: "loc-9", bin: "Shelf C-1", supplier: "sup-2", leadTimeDays: 14, condition: "New", createdAt: daysAgo(60) }),
];

export const inventoryTransactions: InventoryTransaction[] = [
  { id: "tx-1", site: "CHI05", type: "check-out", spareId: "sp-1", quantity: 4, technician: "M. Patel", workOrder: "WO-3421", assetId: "eq-1", reason: "Battery string refresh", timestamp: daysAgo(12) },
  { id: "tx-2", site: "CHI06", type: "check-out", spareId: "sp-9", quantity: 2, technician: "K. Brooks", workOrder: "WO-3445", assetId: "eq-7", reason: "Belt replacement PM", timestamp: daysAgo(8) },
  { id: "tx-3", site: "CHI05", type: "check-in", spareId: "sp-2", quantity: 1, technician: "J. Larsen", condition: "Good", toLocation: "loc-2", timestamp: daysAgo(5) },
  { id: "tx-4", site: "CHI06", type: "check-out", spareId: "sp-4", quantity: 8, technician: "R. Singh", workOrder: "WO-3401", assetId: "eq-4", reason: "Quarterly generator service", timestamp: daysAgo(60) },
  { id: "tx-5", site: "CHI10", type: "transfer", spareId: "sp-10", quantity: 4, technician: "L. Chen", fromLocation: "loc-1", toLocation: "loc-5", timestamp: daysAgo(3) },
  { id: "tx-6", site: "CHI07", type: "check-out", spareId: "sp-14", quantity: 3, technician: "R. Singh", workOrder: "WO-3490", assetId: "eq-12", reason: "Annual PM", timestamp: daysAgo(20) },
];

export const reorderRequests: ReorderRequest[] = [
  { id: "ro-1", site: "CHI06", spareId: "sp-4", quantity: 12, reason: "Out of stock — generator PM cycle", supplier: "sup-4", estimatedCost: 1140, requiredBy: daysAhead(20), requestedBy: "R. Singh", status: "Pending Approval", createdAt: daysAgo(2) },
  { id: "ro-2", site: "CHI05", spareId: "sp-1", quantity: 24, reason: "Below minimum stock", supplier: "sup-1", estimatedCost: 4440, requiredBy: daysAhead(14), requestedBy: "M. Patel", status: "Approved", createdAt: daysAgo(5) },
  { id: "ro-3", site: "CHI06", spareId: "sp-9", quantity: 16, reason: "Low stock after PM", supplier: "sup-2", estimatedCost: 512, requiredBy: daysAhead(10), requestedBy: "K. Brooks", status: "Ordered", createdAt: daysAgo(7) },
  { id: "ro-4", site: "CHI06", spareId: "sp-12", quantity: 6, reason: "Low stock + expiring", supplier: "sup-2", estimatedCost: 660, requiredBy: daysAhead(30), requestedBy: "K. Brooks", status: "Draft", createdAt: daysAgo(1) },
  { id: "ro-5", site: "CHI07", spareId: "sp-14", quantity: 6, reason: "Below minimum", supplier: "sup-4", estimatedCost: 870, requiredBy: daysAhead(35), requestedBy: "R. Singh", status: "Pending Approval", createdAt: daysAgo(1) },
];

export const inspections: Inspection[] = [
  { id: "in-1", site: "CHI05", spareId: "sp-1", inspectionDate: daysAgo(45), inspector: "M. Patel", condition: "Good", findings: "Voltage in spec, no swelling", status: "Pass", nextDue: daysAhead(45) },
  { id: "in-2", site: "CHI05", spareId: "sp-6", inspectionDate: daysAgo(120), inspector: "L. Chen", condition: "Needs Inspection", findings: "Firmware behind, recommend update", status: "Monitor", nextDue: daysAgo(10) },
  { id: "in-3", site: "CHI01", spareId: "sp-7", inspectionDate: daysAgo(15), inspector: "L. Chen", condition: "Good", findings: "Self-test passed", status: "Pass", nextDue: daysAhead(75) },
  { id: "in-4", site: "CHI06", spareId: "sp-11", inspectionDate: daysAgo(30), inspector: "J. Larsen", condition: "Good", findings: "Cleaned and verified", status: "Pass", nextDue: daysAhead(60) },
  { id: "in-5", site: "CHI07", spareId: "sp-14", inspectionDate: daysAgo(200), inspector: "R. Singh", condition: "Good", findings: "Stocked OK", status: "Monitor", nextDue: daysAgo(20) },
];

export const auditLogs: AuditLog[] = [
  { id: "al-1", site: "CHI05", action: "Checked out spare", entity: "spare", entityId: "sp-1", user: "M. Patel", details: "Qty 4 to WO-3421", timestamp: daysAgo(12) },
  { id: "al-2", site: "CHI06", action: "Requested reorder", entity: "reorder", entityId: "ro-1", user: "R. Singh", details: "12 × Generator Fuel Filter", timestamp: daysAgo(2) },
  { id: "al-3", site: "CHI01", action: "Completed inspection", entity: "inspection", entityId: "in-3", user: "L. Chen", details: "SEL-751 — Pass", timestamp: daysAgo(15) },
  { id: "al-4", site: "CHI10", action: "Transferred spare", entity: "spare", entityId: "sp-10", user: "L. Chen", details: "loc-1 → loc-5", timestamp: daysAgo(3) },
];

export const notifications: Notification[] = [];

export const ALL_SITES_FOR_SAMPLE: Site[] = ["CHI01", "CHI02", "CHI05", "CHI06", "CHI07", "CHI10", "CHI22"];
