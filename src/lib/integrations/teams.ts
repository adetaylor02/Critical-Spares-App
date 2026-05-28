/**
 * Microsoft Teams notification stubs.
 * The webhook URL is a server-only secret (`TEAMS_WEBHOOK_URL`) and
 * MUST be called from a server function — never from the browser.
 *
 * The functions below post to `/api/notifications/teams`, which is the
 * server route that owns the actual webhook call.
 */
type Payload = Record<string, unknown>;

async function post(kind: string, payload: Payload) {
  await fetch("/api/notifications/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, payload }),
  }).catch(() => { /* swallow in mock mode */ });
}

export const teamsService = {
  sendLowStockAlert: (p: Payload) => post("low-stock", p),
  sendOutOfStockAlert: (p: Payload) => post("out-of-stock", p),
  sendReorderApprovalRequest: (p: Payload) => post("reorder-approval", p),
  sendInspectionOverdueAlert: (p: Payload) => post("inspection-overdue", p),
  sendImportCompletedNotification: (p: Payload) => post("import-completed", p),
  sendCriticalAssetCoverageAlert: (p: Payload) => post("coverage", p),
};
