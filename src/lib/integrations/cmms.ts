/**
 * CMMS integration — PLACEHOLDER.
 * Replace fetch URLs with the internal CMMS gateway approved by your
 * Microsoft platform team. Auth is OAuth2 client-credentials by default.
 */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`CMMS ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const cmmsService = {
  getAssetsFromCMMS: () => call<unknown[]>("/cmms/assets"),
  getWorkOrdersFromCMMS: () => call<unknown[]>("/cmms/work-orders"),
  linkSpareToWorkOrder: (workOrderId: string, spareId: string, qty: number) =>
    call(`/cmms/work-orders/${workOrderId}/spares`, {
      method: "POST",
      body: JSON.stringify({ spareId, qty }),
    }),
  updateWorkOrderWithSpareUsage: (workOrderId: string, payload: unknown) =>
    call(`/cmms/work-orders/${workOrderId}/usage`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  syncEquipmentAssets: () => call("/cmms/sync/equipment", { method: "POST" }),
  syncWorkOrders: () => call("/cmms/sync/work-orders", { method: "POST" }),
};
