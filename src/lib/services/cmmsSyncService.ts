/**
 * CMMS sync service — orchestrates two-way sync between the internal
 * CMMS (Maximo / SAP PM / custom) and this app's equipment + work order
 * data. Wraps `integrations/cmms.ts`.
 *
 * Today: returns mock acknowledgements so the UI can be wired end-to-end.
 * Migration: each method should call a server function that authenticates
 * with the CMMS using the credentials in CMMS_CLIENT_ID/SECRET (server env).
 */
import { cmmsService } from "@/lib/integrations/cmms";

export const cmmsSyncService = {
  /** Pull asset records from CMMS and reconcile against local equipment. */
  syncAssetsFromCMMS: async () => {
    try {
      const assets = await cmmsService.getAssetsFromCMMS();
      return { ok: true, count: Array.isArray(assets) ? assets.length : 0 };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  /** Pull open work orders so technicians can attach spare usage. */
  syncWorkOrdersFromCMMS: async () => {
    try {
      const wos = await cmmsService.getWorkOrdersFromCMMS();
      return { ok: true, count: Array.isArray(wos) ? wos.length : 0 };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  /** Push a spare check-out back to the originating work order. */
  postSpareUsageToWorkOrder: (workOrderId: string, spareId: string, qty: number) =>
    cmmsService.linkSpareToWorkOrder(workOrderId, spareId, qty),
};
