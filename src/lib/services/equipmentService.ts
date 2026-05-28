import type { EquipmentAsset, SiteScope } from "@/lib/types";
import { store, scopeBySite, textSearch } from "./_common";

export const equipmentService = {
  getAll: (): EquipmentAsset[] => store().equipment,
  getById: (id: string) => store().equipment.find((e) => e.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().equipment, site),
  search: (q: string, site: SiteScope = "All CHI Metro") =>
    textSearch(scopeBySite(store().equipment, site), q, ["name", "tag", "manufacturer", "model"] as never),
  create: (_e: Partial<EquipmentAsset>) => { throw new Error("equipmentService.create: implement against /api/equipment"); },
  update: (_id: string, _p: Partial<EquipmentAsset>) => { throw new Error("equipmentService.update: not implemented"); },
  delete: (_id: string) => { throw new Error("equipmentService.delete: not implemented"); },
};
