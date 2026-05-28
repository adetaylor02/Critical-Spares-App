import type { InventoryTransaction, SiteScope } from "@/lib/types";
import { store, scopeBySite } from "./_common";

export const inventoryTransactionService = {
  getAll: (): InventoryTransaction[] => store().transactions,
  getById: (id: string) => store().transactions.find((t) => t.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().transactions, site),
  search: (q: string) => store().transactions.filter((t) => JSON.stringify(t).toLowerCase().includes(q.toLowerCase())),
  checkOut: store().checkOut,
  checkIn: store().checkIn,
  transfer: store().transfer,
  create: (_t: Partial<InventoryTransaction>) => { throw new Error("Use checkOut/checkIn/transfer"); },
  update: (_id: string, _p: Partial<InventoryTransaction>) => { throw new Error("Transactions are append-only"); },
  delete: (_id: string) => { throw new Error("Transactions are append-only"); },
};
