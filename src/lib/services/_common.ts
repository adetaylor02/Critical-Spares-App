import { useApp } from "@/lib/store";
import type { Site, SiteScope } from "@/lib/types";

/** Access the current in-memory store snapshot (mock backend). */
export const store = () => useApp.getState();

/** Apply site scoping consistently across services. */
export function scopeBySite<T extends { site?: Site }>(rows: T[], site: SiteScope): T[] {
  if (site === "All CHI Metro") return rows;
  return rows.filter((r) => r.site === site);
}

/** Naive in-memory search across stringifiable fields. */
export function textSearch<T>(rows: T[], q: string, fields: (keyof T)[]): T[] {
  if (!q) return rows;
  const needle = q.toLowerCase();
  return rows.filter((r) =>
    fields.some((f) => String(r[f] ?? "").toLowerCase().includes(needle)),
  );
}
