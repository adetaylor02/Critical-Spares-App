/**
 * Microsoft Entra ID (Azure AD) authentication — INTEGRATION PLACEHOLDER.
 *
 * The current build uses Lovable Cloud auth (see `src/lib/auth.tsx`).
 * To switch to MSAL:
 *
 *   bun add @azure/msal-browser @azure/msal-react
 *
 * Then wire `MsalProvider` at the root and replace `useAuth()` calls with
 * `useMsal()` + a group-claim → role mapper using `ENTRA_GROUP_TO_ROLE`
 * (see `services/userRoleService.ts`).
 */
import { config } from "@/lib/config";

export const msalConfig = {
  auth: {
    clientId: config.entra.clientId,
    authority: `https://login.microsoftonline.com/${config.entra.tenantId}`,
    redirectUri: config.entra.redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: config.entra.scopes,
};

/** Map Entra ID group object IDs / display names → app roles. */
export function rolesFromEntraGroups(groups: string[]): string[] {
  const map: Record<string, string> = {
    CriticalSpares_Admins: "Admin",
    CriticalSpares_Managers: "Manager",
    CriticalSpares_Technicians: "Technician",
    CriticalSpares_Viewers: "Viewer",
  };
  return groups.map((g) => map[g]).filter(Boolean);
}
