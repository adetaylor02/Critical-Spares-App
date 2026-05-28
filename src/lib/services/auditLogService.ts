import type { AuditLog, SiteScope } from "@/lib/types";
import { store, scopeBySite } from "./_common";

export const auditLogService = {
  getAll: (): AuditLog[] => store().auditLogs,
  getById: (id: string) => store().auditLogs.find((a) => a.id === id),
  filterBySite: (site: SiteScope) => scopeBySite(store().auditLogs, site),
  search: (q: string) => store().auditLogs.filter((a) => JSON.stringify(a).toLowerCase().includes(q.toLowerCase())),
  create: (_a: Partial<AuditLog>) => { throw new Error("Audit logs are written by the store internally"); },
  update: () => { throw new Error("Audit logs are immutable"); },
  delete: () => { throw new Error("Audit logs are immutable"); },
};
