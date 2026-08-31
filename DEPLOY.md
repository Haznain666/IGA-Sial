# Deploy — IGA Sial Farm (Sponsor-a-Cow)

This is a static single-page app (React 18 + Vite 5, `HashRouter`). The production
build is a set of static files in `dist/` — no Node server is required to serve it.

## 1. Build

```bash
cd D:\iga-sial-farm
npm ci              # or npm install
npm run build        # -> dist/
```

Vite inlines environment variables into the JS bundle **at build time**, so the
Supabase env vars below must be present in the environment (or in a local `.env`)
*before* running `npm run build` — setting them after the build has no effect.

## 2. Environment variables

Two variables are required, both safe to expose in the browser bundle (Supabase
"publishable"/anon-style values, not service-role secrets):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) API key |

- Local dev/build: copy `.env.example` to `.env` and fill in real values (`.env` is
gitignored).
- CI/GitHub Actions: pulled from repository secrets `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Why `VITE_` is required in a Vite app

This is a plain Vite/React SPA. Vite only exposes client-side env vars whose names
start with `VITE_`, so the browser bundle can only read `import.meta.env.VITE_*`.
The app must not rely on any non-`VITE_` names in the browser code.

### Supabase project

Project URL: `https://befqbzgoygekawcguzrz.supabase.co` (see `.env` for the current
publishable key). This project is being wired up by the fullstack agent under
`src/`/`supabase/`; the URL is stable, only the schema/RLS policies are evolving.

## 3. Deploying to Hostinger

The app is deployed as a static site on Hostinger.

```bash
cd D:\iga-sial-farm
npm run build
# zip the dist/ output, then deploy the archive to the target Hostinger domain,
# e.g. via the Hostinger MCP hosting_deployStaticWebsite tool, or by uploading
# the archive through hPanel's File Manager and extracting it into public_html.
```

After deploying, clear the site's cache (Hostinger MCP `hosting_clearWebsiteCacheV1`,
or hPanel → Website → Cache) so visitors don't see a stale bundle.

**No server-side rewrite rules are needed.** This app uses React Router's
`HashRouter`, so every route lives under a `#` fragment (e.g. `/#/select`,
`/#/super-admin`). The fragment is never sent to the server — the server only
ever needs to serve `index.html` (plus the static assets) for any request, which
is exactly what a plain static file host does by default. This avoids the usual
SPA problem of deep-link routes 404'ing on a host that isn't configured with a
`try_files`/rewrite-to-`index.html` rule.

## 4. Redeploying after changes

1. `npm run build` (regenerates `dist/`).
2. Re-run the static deploy step above against the same Hostinger domain — this
   replaces the previous `dist/` contents.
3. Clear the website cache so the new build is served immediately.

## 5. CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR to `main`: checks out the repo,
sets up Node 20, `npm ci`, then `npm run build` with the Supabase env vars above
injected from repository secrets (falling back to `.env.example` placeholders).
This is a build-verification gate only — it does not deploy. Deployment to
Hostinger is a manual step (see §3) until/unless a deploy job is added to the
workflow.
