/**
 * Reports service — aggregates data for dashboards and exports.
 *
 * Today: computes against the in-browser store.
 * Migration: replace with calls to a server function that runs the same
 * aggregations against Azure SQL / Dataverse, or hand off to Power BI
 * (see `integrations/powerbi.ts`).
 */
import type { SiteScope } from "@/lib/types";
import { store, scopeBySite } from "./_common";

export const reportsService = {
  stockSummary: (site: SiteScope = "All CHI Metro") => {
    const spares = scopeBySite(store().spares, site);
    return {
      total: spares.length,
      low: spares.filter((s) => s.quantity > 0 && s.quantity < s.minStock).length,
      outOfStock: spares.filter((s) => s.quantity === 0).length,
      valueUSD: spares.reduce((sum, s) => sum + (s.unitCost ?? 0) * s.quantity, 0),
    };
  },

  consumptionByMonth: (site: SiteScope = "All CHI Metro", months = 12) => {
    const tx = scopeBySite(store().transactions, site).filter((t) => t.type === "check-out");
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[d.toISOString().slice(0, 7)] = 0;
    }
    tx.forEach((t) => {
      const key = new Date(t.timestamp).toISOString().slice(0, 7);
      if (key in buckets) buckets[key] += t.quantity;
    });
    return Object.entries(buckets).map(([month, qty]) => ({ month, qty }));
  },

  criticalCoverageGap: (site: SiteScope = "All CHI Metro") => {
    const equipment = scopeBySite(store().equipment, site).filter((e) => e.criticality === "Critical");
    const spares = scopeBySite(store().spares, site);
    return equipment.filter((e) => !spares.some((s) => s.equipmentSupported.includes(e.id)));
  },

  /** Triggers a server-side export to CSV/Parquet for Power BI dataflows. */
  exportForPowerBi: (view: "spares" | "transactions" | "reorders" | "inspections") =>
    fetch(`/api/reports?view=${view}`, { method: "POST" }),
};
