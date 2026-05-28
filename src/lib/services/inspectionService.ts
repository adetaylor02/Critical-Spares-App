import type { Inspection, SiteScope } from "@/lib/types";
import { store, scopeBySite } from "./_common";

export const inspectionService = {
  getAll: (): Inspection[] => store().inspections,
  getById: (id: string) => store().inspections.find((i) => i.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().inspections, site),
  search: (q: string) => store().inspections.filter((i) => JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),
  create: store().addInspection,
  update: (_id: string, _p: Partial<Inspection>) => { throw new Error("inspectionService.update: not implemented"); },
  delete: (_id: string) => { throw new Error("inspectionService.delete: not implemented"); },
};
