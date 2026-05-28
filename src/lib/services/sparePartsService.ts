import type { SparePart, SiteScope } from "@/lib/types";
import { store, scopeBySite, textSearch } from "./_common";

export const sparePartsService = {
  getAll: (): SparePart[] => store().spares,
  getById: (id: string) => store().spares.find((s) => s.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().spares, site),
  search: (q: string, site: SiteScope = "All CHI Metro") =>
    textSearch(scopeBySite(store().spares, site), q, [
      "partName", "manufacturer", "modelNumber", "description",
    ]),
  create: (input: Omit<SparePart, "id" | "createdAt" | "documents">) =>
    store().addSpare(input),
  update: (id: string, patch: Partial<SparePart>) => store().updateSpare(id, patch),
  delete: (id: string) => store().deleteSpare(id),
};
