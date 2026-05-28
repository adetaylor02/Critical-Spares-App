/**
 * Power BI integration — PLACEHOLDER.
 *
 * Approach:
 *   1. Server function exchanges the user's Entra ID token for a
 *      Power BI embed token via the REST API.
 *   2. Client renders the report with `powerbi-client-react`.
 *
 *   bun add powerbi-client powerbi-client-react
 */
export interface EmbedConfig {
  reportId: string;
  workspaceId: string;
  embedUrl: string;
  accessToken: string;
}

export const powerbiService = {
  async getEmbedConfig(reportId: string): Promise<EmbedConfig> {
    const res = await fetch(`/api/powerbi/reports/${reportId}/embed`);
    if (!res.ok) throw new Error(`PowerBI embed config: ${res.status}`);
    return res.json();
  },
  exportDataset(view: string) {
    // Triggers a server-side CSV/Parquet export staged for PBI dataflow.
    return fetch(`/api/powerbi/export/${view}`, { method: "POST" });
  },
};
