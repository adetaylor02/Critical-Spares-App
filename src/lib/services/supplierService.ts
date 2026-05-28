import type { Supplier } from "@/lib/types";
import { store, textSearch } from "./_common";

export const supplierService = {
  getAll: (): Supplier[] => store().suppliers,
  getById: (id: string) => store().suppliers.find((s) => s.id === id),
  filterBySite: () => store().suppliers, // suppliers are global
  search: (q: string) => textSearch(store().suppliers, q, ["name", "contact", "email"] as never),
  create: (_s: Partial<Supplier>) => { throw new Error("supplierService.create: not implemented"); },
  update: (_id: string, _p: Partial<Supplier>) => { throw new Error("supplierService.update: not implemented"); },
  delete: (_id: string) => { throw new Error("supplierService.delete: not implemented"); },
};
