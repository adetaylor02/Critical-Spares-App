import type { Notification } from "@/lib/types";
import { store } from "./_common";

export const notificationService = {
  getAll: (): Notification[] => store().notifications(),
  getById: (id: string) => store().notifications().find((n) => n.id === id),
  filterBySite: () => store().notifications(),
  search: (q: string) => store().notifications().filter((n) => n.message.toLowerCase().includes(q.toLowerCase())),
  create: (_n: Partial<Notification>) => { throw new Error("Notifications are derived, not created"); },
  update: () => { throw new Error("Not supported"); },
  delete: () => { throw new Error("Not supported"); },
};
