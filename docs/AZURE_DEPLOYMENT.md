# Azure Deployment Guide

This codebase is **Azure-ready**. Pick the hosting model that matches your
internal approval path, then follow the matching section.

| Hosting model | When to use | Build output served |
|---|---|---|
| **Azure Static Web Apps (SWA)** | Recommended for most teams. Free Entra integration, global CDN, integrated `/api` Azure Functions. | `dist/` static assets + `api/` functions |
| **Azure App Service (Node 20 Linux)** | When you need a long-running Node SSR process, custom networking (VNET), or private endpoints. | Node server (`server.js`) |
| **Azure App Service (Windows / IIS)** | Only if Windows hosting is mandated. Uses `web.config` + iisnode. | Node server behind IIS |

The repo ships scaffolding for all three:

```
.github/workflows/azure-static-web-apps.yml   # SWA pipeline
.github/workflows/azure-webapp-node.yml       # App Service (Linux) pipeline
web.config                                    # IIS rewrite rules (Windows)
.deployment                                   # Kudu build hint
```

---

## Option A — Azure Static Web Apps (recommended)

1. **Create the resource** (Portal → *Create a resource* → *Static Web App*).
   - Plan: **Standard** (required for Entra ID auth + private endpoints).
   - Source: **GitHub** → pick this repo and branch.
   - Build preset: **Custom**.
     - App location: `/`
     - Output location: `dist`
     - API location: `api` (optional — leave blank if you keep TanStack server routes)
2. Azure auto-creates a deployment token. The bundled workflow
   `.github/workflows/azure-static-web-apps.yml` picks it up from the secret
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. **Configure environment variables** under *Configuration → Application settings*.
   Use every key from `.env.example` (Entra, Power BI, Teams webhook, CMMS, …).
4. **Enable Entra ID** under *Authentication → Add identity provider →
   Microsoft*. Point it at the app registration created per `DEPLOYMENT.md §1`.
5. Push to `main` → GitHub Actions builds and publishes to SWA.

> The current SSR target is Cloudflare Workers (`wrangler.jsonc`). SWA serves
> the pre-built static bundle, so SSR-only features (server functions under
> `src/routes/api/*`) need to be re-implemented as Azure Functions in `api/`
> *or* you switch to Option B for full SSR.

## Option B — Azure App Service (Linux, Node 20)

1. **Provision**:
   ```bash
   az group create -n rg-critical-spares -l westeurope
   az appservice plan create -g rg-critical-spares -n plan-cs --sku P1v3 --is-linux
   az webapp create -g rg-critical-spares -p plan-cs -n app-critical-spares \
     --runtime "NODE:20-lts"
   ```
2. **Application settings** (Portal → *Configuration*): paste every key from
   `.env.example`. Use Key Vault references for secrets
   (`@Microsoft.KeyVault(SecretUri=…)`).
3. **Startup command**: `node server.js` (already wired in `package.json`).
4. **Deploy** via the bundled workflow `.github/workflows/azure-webapp-node.yml`.
   Add a GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE` (download from Portal →
   *Get publish profile*).
5. **Custom domain + TLS**: bind your `*.contoso.com` cert under
   *Custom domains*.
6. **Entra ID**: *Authentication → Add identity provider → Microsoft*. Use the
   same app registration as the SPA, add the App Service URL as a redirect URI.

## Option C — App Service (Windows / IIS)

`web.config` ships pre-configured for iisnode. Use only when Windows hosting
is mandated. Set the App Service stack to **Node 20 LTS (Windows)**, then
deploy as in Option B.

---

## Required GitHub repository secrets

| Secret | Used by | Where to find |
|---|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA workflow | SWA → *Manage deployment token* |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | App Service workflow | App Service → *Get publish profile* |
| `AZURE_WEBAPP_NAME` | App Service workflow | The resource name you chose |

## Pre-flight checklist

- [ ] App registration created in Entra ID; tenant + client IDs in app settings
- [ ] Security groups (`CriticalSpares_*`) created and assigned
- [ ] Key Vault provisioned; secrets referenced from App Service config
- [ ] Database provisioned (Azure SQL or Dataverse) and reachable from the App Service subnet
- [ ] `dist/` build succeeds locally (`bun run build`)
- [ ] Teams webhook stored in Key Vault, referenced as `TEAMS_WEBHOOK_URL`
- [ ] Power BI workspace + report IDs stored as app settings
- [ ] Custom domain + TLS bound
- [ ] Diagnostic settings forward logs to Log Analytics

Once these are green, push to `main` and the workflow handles the rest.
