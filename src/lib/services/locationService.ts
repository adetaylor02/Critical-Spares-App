import type { Location, SiteScope } from "@/lib/types";
import { store, scopeBySite, textSearch } from "./_common";

export const locationService = {
  getAll: (): Location[] => store().locations,
  getById: (id: string) => store().locations.find((l) => l.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().locations, site),
  search: (q: string, site: SiteScope = "All CHI Metro") =>
    textSearch(scopeBySite(store().locations, site), q, ["name", "building", "room"] as never),
  create: (_l: Partial<Location>) => { throw new Error("locationService.create: not implemented"); },
  update: (_id: string, _p: Partial<Location>) => { throw new Error("locationService.update: not implemented"); },
  delete: (_id: string) => { throw new Error("locationService.delete: not implemented"); },
};
