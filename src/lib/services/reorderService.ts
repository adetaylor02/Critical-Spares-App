import type { ReorderRequest, ReorderStatus, SiteScope } from "@/lib/types";
import { store, scopeBySite } from "./_common";

export const reorderService = {
  getAll: (): ReorderRequest[] => store().reorders,
  getById: (id: string) => store().reorders.find((r) => r.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().reorders, site),
  search: (q: string) => store().reorders.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())),
  create: store().addReorder,
  update: (id: string, patch: Partial<ReorderRequest>) => {
    if (patch.status) store().setReorderStatus(id, patch.status as ReorderStatus);
  },
  setStatus: (id: string, status: ReorderStatus) => store().setReorderStatus(id, status),
  delete: (_id: string) => { throw new Error("reorderService.delete: not implemented"); },
};
