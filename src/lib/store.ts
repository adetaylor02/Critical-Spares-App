import { useMemo } from "react";
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
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
  Role,
  ReorderStatus,
  Condition,
  Site,
  SiteScope,
} from "./types";
import {
  spareParts as seedSpares,
  equipment as seedEquipment,
  inventoryTransactions as seedTx,
  reorderRequests as seedReorders,
  inspections as seedInspections,
  suppliers as seedSuppliers,
  locations as seedLocations,
  auditLogs as seedAudit,
} from "./sample-data";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

interface PersistedState {
  spares: SparePart[];
  equipment: EquipmentAsset[];
  transactions: InventoryTransaction[];
  reorders: ReorderRequest[];
  inspections: Inspection[];
  suppliers: Supplier[];
  locations: Location[];
  auditLogs: AuditLog[];
}

interface AppState extends PersistedState {
  role: Role;
  setRole: (r: Role) => void;
  currentUser: string;
  setCurrentUser: (u: string) => void;

  selectedSite: SiteScope;
  setSelectedSite: (s: SiteScope) => void;

  dismissedNotifications: string[];
  dismissNotification: (id: string) => void;
  dismissAllNotifications: (ids: string[]) => void;
  restoreNotifications: () => void;

  hydrated: boolean;
  hydrate: () => Promise<void>;

  addSpare: (s: Omit<SparePart, "id" | "createdAt" | "documents">) => SparePart;
  updateSpare: (id: string, patch: Partial<SparePart>) => void;
  deleteSpare: (id: string) => void;
  duplicateSpare: (id: string) => void;

  bulkImportSpares: (rows: Omit<SparePart, "id" | "createdAt" | "documents">[], mode: "skip" | "update" | "new") => { batchId: string; imported: number; updated: number; skipped: number };

  checkOut: (input: { spareId: string; quantity: number; technician: string; workOrder?: string; assetId?: string; reason?: string }) => void;
  checkIn: (input: { spareId: string; quantity: number; technician: string; condition: Condition; toLocation: string; reason?: string }) => void;
  transfer: (input: { spareId: string; quantity: number; technician: string; fromLocation: string; toLocation: string }) => void;

  addReorder: (r: Omit<ReorderRequest, "id" | "createdAt" | "status"> & { status?: ReorderStatus }) => void;
  setReorderStatus: (id: string, status: ReorderStatus) => void;

  addInspection: (i: Omit<Inspection, "id">) => void;

  notifications: () => Notification[];
  resetToSampleData: () => Promise<void>;
}

const log = (logs: AuditLog[], entry: Omit<AuditLog, "id" | "timestamp">): AuditLog[] => [
  { ...entry, id: uid("al"), timestamp: new Date().toISOString() },
  ...logs,
];

const PERSIST_KEYS: (keyof PersistedState)[] = [
  "spares",
  "equipment",
  "transactions",
  "reorders",
  "inspections",
  "suppliers",
  "locations",
  "auditLogs",
];

const seedState: PersistedState = {
  spares: seedSpares,
  equipment: seedEquipment,
  transactions: seedTx,
  reorders: seedReorders,
  inspections: seedInspections,
  suppliers: seedSuppliers,
  locations: seedLocations,
  auditLogs: seedAudit,
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave = false;
let inflightSave = false;

function snapshot(st: AppState): PersistedState {
  return {
    spares: st.spares,
    equipment: st.equipment,
    transactions: st.transactions,
    reorders: st.reorders,
    inspections: st.inspections,
    suppliers: st.suppliers,
    locations: st.locations,
    auditLogs: st.auditLogs,
  };
}

async function persistNow(data: PersistedState) {
  inflightSave = true;
  try {
    const { error } = await supabase
      .from("app_state")
      .upsert({ id: "singleton", data: data as never, updated_at: new Date().toISOString() });
    if (error) console.error("[app_state] save failed", error);
  } finally {
    inflightSave = false;
    if (pendingSave) {
      pendingSave = false;
      schedulePersist();
    }
  }
}

function schedulePersist() {
  if (typeof window === "undefined") return;
  if (!useApp.getState().hydrated) return;
  if (inflightSave) { pendingSave = true; return; }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistNow(snapshot(useApp.getState()));
  }, 400);
}

const SITE_KEY = "csm.selectedSite";
const loadSite = (): SiteScope => {
  if (typeof window === "undefined") return "All CHI Metro";
  const v = window.localStorage.getItem(SITE_KEY);
  return (v as SiteScope) || "All CHI Metro";
};

const DISMISSED_KEY = "csm.dismissedNotifications";
const loadDismissed = (): string[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; }
};
const saveDismissed = (ids: string[]) => {
  if (typeof window !== "undefined") window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
};

export const useApp = create<AppState>((set, get) => ({
  role: "Viewer",
  setRole: (r) => set({ role: r }),
  currentUser: "User",
  setCurrentUser: (u) => set({ currentUser: u }),

  selectedSite: loadSite(),
  setSelectedSite: (s) => {
    if (typeof window !== "undefined") window.localStorage.setItem(SITE_KEY, s);
    set({ selectedSite: s });
  },

  dismissedNotifications: loadDismissed(),
  dismissNotification: (id: string) => {
    const next = Array.from(new Set([...(get().dismissedNotifications ?? []), id]));
    saveDismissed(next);
    set({ dismissedNotifications: next });
  },
  dismissAllNotifications: (ids: string[]) => {
    const next = Array.from(new Set([...(get().dismissedNotifications ?? []), ...ids]));
    saveDismissed(next);
    set({ dismissedNotifications: next });
  },
  restoreNotifications: () => {
    saveDismissed([]);
    set({ dismissedNotifications: [] });
  },

  hydrated: false,

  spares: [],
  equipment: [],
  transactions: [],
  reorders: [],
  inspections: [],
  suppliers: [],
  locations: [],
  auditLogs: [],

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const { data, error } = await supabase
        .from("app_state")
        .select("data")
        .eq("id", "singleton")
        .maybeSingle();
      if (error) throw error;
      if (data?.data && typeof data.data === "object") {
        const d = data.data as Partial<PersistedState>;
        const next: Partial<PersistedState> = {};
        for (const k of PERSIST_KEYS) {
          // @ts-expect-error generic assign
          next[k] = Array.isArray(d[k]) ? d[k] : seedState[k];
        }
        set({ ...(next as PersistedState), hydrated: true });
      } else {
        // First run – seed cloud with sample data
        set({ ...seedState, hydrated: true });
        await persistNow(seedState);
      }
    } catch (e) {
      console.error("[app_state] hydrate failed, using sample data", e);
      set({ ...seedState, hydrated: true });
    }
  },

  resetToSampleData: async () => {
    set({ ...seedState });
    await persistNow(seedState);
  },

  addSpare: (s) => {
    const sp: SparePart = { ...s, id: uid("sp"), createdAt: new Date().toISOString(), documents: [] };
    set((st) => ({
      spares: [sp, ...st.spares],
      auditLogs: log(st.auditLogs, { action: "Created spare", entity: "spare", entityId: sp.id, user: st.currentUser, details: sp.partName }),
    }));
    schedulePersist();
    return sp;
  },
  updateSpare: (id, patch) => {
    set((st) => ({
      spares: st.spares.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      auditLogs: log(st.auditLogs, { action: "Edited spare", entity: "spare", entityId: id, user: st.currentUser }),
    }));
    schedulePersist();
  },
  deleteSpare: (id) => {
    set((st) => ({
      spares: st.spares.filter((s) => s.id !== id),
      auditLogs: log(st.auditLogs, { action: "Deleted spare", entity: "spare", entityId: id, user: st.currentUser }),
    }));
    schedulePersist();
  },
  duplicateSpare: (id) => {
    set((st) => {
      const orig = st.spares.find((s) => s.id === id);
      if (!orig) return st;
      const copy: SparePart = { ...orig, id: uid("sp"), partName: `${orig.partName} (Copy)`, createdAt: new Date().toISOString() };
      return {
        spares: [copy, ...st.spares],
        auditLogs: log(st.auditLogs, { action: "Duplicated spare", entity: "spare", entityId: copy.id, user: st.currentUser }),
      };
    });
    schedulePersist();
  },

  bulkImportSpares: (rows, mode) => {
    const batchId = `IMP-${Date.now().toString(36).toUpperCase()}`;
    let imported = 0, updated = 0, skipped = 0;
    const st = get();
    const newSpares = [...st.spares];
    const auditAdd: AuditLog[] = [];
    const now = new Date().toISOString();
    for (const r of rows) {
      const dupIdx = newSpares.findIndex(
        (s) =>
          s.site === r.site &&
          s.partName.toLowerCase() === r.partName.toLowerCase() &&
          s.modelNumber.toLowerCase() === (r.modelNumber || "").toLowerCase() &&
          (s.serialNumber || "").toLowerCase() === (r.serialNumber || "").toLowerCase(),
      );
      if (dupIdx >= 0) {
        if (mode === "skip") { skipped++; continue; }
        if (mode === "update") {
          newSpares[dupIdx] = { ...newSpares[dupIdx], ...r };
          updated++;
          auditAdd.push({ id: uid("al"), site: r.site, action: `Import ${batchId} · updated spare`, entity: "spare", entityId: newSpares[dupIdx].id, user: st.currentUser, details: r.partName, timestamp: now });
          continue;
        }
      }
      const sp: SparePart = { ...r, id: uid("sp"), createdAt: now, documents: [] };
      newSpares.unshift(sp);
      imported++;
      auditAdd.push({ id: uid("al"), site: r.site, action: `Import ${batchId} · created spare`, entity: "spare", entityId: sp.id, user: st.currentUser, details: r.partName, timestamp: now });
    }
    auditAdd.unshift({ id: uid("al"), action: `Bulk import ${batchId}`, entity: "import", entityId: batchId, user: st.currentUser, details: `${imported} created, ${updated} updated, ${skipped} skipped`, timestamp: now });
    set({ spares: newSpares, auditLogs: [...auditAdd, ...st.auditLogs] });
    schedulePersist();
    return { batchId, imported, updated, skipped };
  },

  checkOut: ({ spareId, quantity, technician, workOrder, assetId, reason }) => {
    set((st) => {
      const tx: InventoryTransaction = {
        id: uid("tx"), type: "check-out", spareId, quantity, technician, workOrder, assetId, reason, timestamp: new Date().toISOString(),
      };
      return {
        spares: st.spares.map((s) => (s.id === spareId ? { ...s, quantity: Math.max(0, s.quantity - quantity), lastUsed: tx.timestamp } : s)),
        transactions: [tx, ...st.transactions],
        auditLogs: log(st.auditLogs, { action: "Checked out spare", entity: "spare", entityId: spareId, user: technician, details: `Qty ${quantity}${workOrder ? ` · ${workOrder}` : ""}` }),
      };
    });
    schedulePersist();
  },

  checkIn: ({ spareId, quantity, technician, condition, toLocation, reason }) => {
    set((st) => {
      const tx: InventoryTransaction = {
        id: uid("tx"), type: "check-in", spareId, quantity, technician, condition, toLocation, reason, timestamp: new Date().toISOString(),
      };
      return {
        spares: st.spares.map((s) => (s.id === spareId ? { ...s, quantity: s.quantity + quantity, condition, location: toLocation } : s)),
        transactions: [tx, ...st.transactions],
        auditLogs: log(st.auditLogs, { action: "Checked in spare", entity: "spare", entityId: spareId, user: technician, details: `Qty ${quantity} · ${condition}` }),
      };
    });
    schedulePersist();
  },

  transfer: ({ spareId, quantity, technician, fromLocation, toLocation }) => {
    set((st) => {
      const tx: InventoryTransaction = {
        id: uid("tx"), type: "transfer", spareId, quantity, technician, fromLocation, toLocation, timestamp: new Date().toISOString(),
      };
      return {
        spares: st.spares.map((s) => (s.id === spareId ? { ...s, location: toLocation } : s)),
        transactions: [tx, ...st.transactions],
        auditLogs: log(st.auditLogs, { action: "Transferred spare", entity: "spare", entityId: spareId, user: technician, details: `${fromLocation} → ${toLocation}` }),
      };
    });
    schedulePersist();
  },

  addReorder: (r) => {
    set((st) => {
      const ro: ReorderRequest = { ...r, id: uid("ro"), createdAt: new Date().toISOString(), status: r.status ?? "Pending Approval" };
      return {
        reorders: [ro, ...st.reorders],
        auditLogs: log(st.auditLogs, { action: "Requested reorder", entity: "reorder", entityId: ro.id, user: r.requestedBy, details: `Qty ${r.quantity}` }),
      };
    });
    schedulePersist();
  },

  setReorderStatus: (id, status) => {
    set((st) => ({
      reorders: st.reorders.map((r) => (r.id === id ? { ...r, status } : r)),
      auditLogs: log(st.auditLogs, { action: `Reorder → ${status}`, entity: "reorder", entityId: id, user: st.currentUser }),
    }));
    schedulePersist();
  },

  addInspection: (i) => {
    set((st) => {
      const ins: Inspection = { ...i, id: uid("in") };
      return {
        inspections: [ins, ...st.inspections],
        spares: st.spares.map((s) => (s.id === i.spareId ? { ...s, lastInspected: i.inspectionDate, condition: i.condition } : s)),
        auditLogs: log(st.auditLogs, { action: "Completed inspection", entity: "inspection", entityId: ins.id, user: i.inspector, details: i.status }),
      };
    });
    schedulePersist();
  },

  notifications: () => {
    const st = get();
    const list: Notification[] = [];
    const now = Date.now();
    st.spares.forEach((s) => {
      if (s.quantity === 0) list.push({ id: `n-oos-${s.id}`, type: "out-of-stock", message: `${s.partName} is out of stock`, severity: "critical", timestamp: new Date().toISOString(), read: false });
      else if (s.quantity < s.minStock) list.push({ id: `n-low-${s.id}`, type: "low-stock", message: `${s.partName} below minimum (${s.quantity}/${s.minStock})`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      if (s.expiryDate && new Date(s.expiryDate).getTime() - now < 1000 * 86400 * 120) {
        list.push({ id: `n-exp-${s.id}`, type: "expiry", message: `${s.partName} expires soon`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      }
    });
    st.inspections.forEach((i) => {
      if (new Date(i.nextDue).getTime() < now) {
        const sp = st.spares.find((s) => s.id === i.spareId);
        list.push({ id: `n-ins-${i.id}`, type: "inspection", message: `Inspection overdue: ${sp?.partName ?? i.spareId}`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      }
    });
    st.reorders.forEach((r) => {
      if (r.status === "Pending Approval") {
        const sp = st.spares.find((s) => s.id === r.spareId);
        list.push({ id: `n-ro-${r.id}`, type: "reorder", message: `Reorder pending approval: ${sp?.partName ?? r.spareId}`, severity: "info", timestamp: r.createdAt, read: false });
      }
    });
    st.equipment.forEach((e) => {
      if (e.criticality === "Critical") {
        const covered = st.spares.some((s) => s.equipmentSupported.includes(e.id));
        if (!covered) list.push({ id: `n-cov-${e.id}`, type: "coverage", message: `Critical asset has no spare coverage: ${e.name}`, severity: "critical", timestamp: new Date().toISOString(), read: false });
      }
    });
    return list;
  },
}));

// Memoized hook to safely consume computed notifications without causing
// infinite render loops (the selector approach returns a new array each call).
export function useNotifications(): Notification[] {
  const spares = useApp((s) => s.spares);
  const inspections = useApp((s) => s.inspections);
  const reorders = useApp((s) => s.reorders);
  const equipment = useApp((s) => s.equipment);
  const dismissed = useApp((s) => s.dismissedNotifications);
  return useMemo(() => {
    const list: Notification[] = [];
    const now = Date.now();
    spares.forEach((s) => {
      if (s.quantity === 0) list.push({ id: `n-oos-${s.id}`, type: "out-of-stock", message: `${s.partName} is out of stock`, severity: "critical", timestamp: new Date().toISOString(), read: false });
      else if (s.quantity < s.minStock) list.push({ id: `n-low-${s.id}`, type: "low-stock", message: `${s.partName} below minimum (${s.quantity}/${s.minStock})`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      if (s.expiryDate && new Date(s.expiryDate).getTime() - now < 1000 * 86400 * 120) {
        list.push({ id: `n-exp-${s.id}`, type: "expiry", message: `${s.partName} expires soon`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      }
    });
    inspections.forEach((i) => {
      if (new Date(i.nextDue).getTime() < now) {
        const sp = spares.find((s) => s.id === i.spareId);
        list.push({ id: `n-ins-${i.id}`, type: "inspection", message: `Inspection overdue: ${sp?.partName ?? i.spareId}`, severity: "warning", timestamp: new Date().toISOString(), read: false });
      }
    });
    reorders.forEach((r) => {
      if (r.status === "Pending Approval") {
        const sp = spares.find((s) => s.id === r.spareId);
        list.push({ id: `n-ro-${r.id}`, type: "reorder", message: `Reorder pending approval: ${sp?.partName ?? r.spareId}`, severity: "info", timestamp: r.createdAt, read: false });
      }
    });
    equipment.forEach((e) => {
      if (e.criticality === "Critical") {
        const covered = spares.some((s) => s.equipmentSupported.includes(e.id));
        if (!covered) list.push({ id: `n-cov-${e.id}`, type: "coverage", message: `Critical asset has no spare coverage: ${e.name}`, severity: "critical", timestamp: new Date().toISOString(), read: false });
      }
    });
    const dset = new Set(dismissed);
    return list.filter((n) => !dset.has(n.id));
  }, [spares, inspections, reorders, equipment, dismissed]);
}

// Site-scoped data hooks. Pass an item's `site` (or undefined for "ungated" items
// such as legacy transactions) and they will be filtered by the global site selector.
function filterBySite<T extends { site?: Site }>(items: T[], scope: SiteScope): T[] {
  if (scope === "All CHI Metro") return items;
  return items.filter((i) => !i.site || i.site === scope);
}

export function useScopedSpares() {
  const spares = useApp((s) => s.spares);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(spares, scope), [spares, scope]);
}
export function useScopedEquipment() {
  const equipment = useApp((s) => s.equipment);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(equipment, scope), [equipment, scope]);
}
export function useScopedTransactions() {
  const tx = useApp((s) => s.transactions);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(tx, scope), [tx, scope]);
}
export function useScopedReorders() {
  const r = useApp((s) => s.reorders);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(r, scope), [r, scope]);
}
export function useScopedInspections() {
  const i = useApp((s) => s.inspections);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(i, scope), [i, scope]);
}
export function useScopedLocations() {
  const l = useApp((s) => s.locations);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(l, scope), [l, scope]);
}
export function useScopedAuditLogs() {
  const a = useApp((s) => s.auditLogs);
  const scope = useApp((s) => s.selectedSite);
  return useMemo(() => filterBySite(a, scope), [a, scope]);
}


