/**
 * Centralised runtime configuration.
 *
 * Client-safe values come from `import.meta.env.VITE_*`.
 * Server-only secrets (DATABASE_URL, AZURE_SQL_CONNECTION_STRING,
 * CMMS_CLIENT_SECRET, TEAMS_WEBHOOK_URL, …) MUST be accessed via
 * `process.env.*` inside server functions / server routes — never
 * import them into client bundles.
 */
export const config = {
  appName: import.meta.env.VITE_APP_NAME ?? "Critical Spares Manager",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",

  entra: {
    tenantId: import.meta.env.VITE_TENANT_ID ?? "",
    clientId: import.meta.env.VITE_CLIENT_ID ?? "",
    redirectUri:
      import.meta.env.VITE_REDIRECT_URI ??
      (typeof window !== "undefined" ? window.location.origin : ""),
    scopes: ["openid", "profile", "email", "User.Read"],
  },

  powerbi: {
    // Populated server-side; left blank in the browser bundle on purpose.
    workspaceId: "",
    reportId: "",
  },

  features: {
    useMockAuth: true,           // flip to false when Entra ID is wired
    useMockData: true,           // flip when real APIs are connected
    enableCmmsSync: false,
    enableTeamsNotifications: false,
    enablePowerBiEmbed: false,
  },
} as const;

export type AppConfig = typeof config;
