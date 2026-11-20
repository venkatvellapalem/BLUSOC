# Deploying the website

The Next.js showcase is independent of the SOC server. It uses bundled JSON and browser interactions, with no backend credentials or database connection.

## Local production server

Use Node.js 24 and run commands from the repository root:

```bash
npm ci
npm run verify:all
npm start
```

The default port is 3000. Set the standard `PORT` environment variable when your hosting platform assigns another port. Put a TLS reverse proxy in front of a self-hosted public server.

Fonts are included locally with their license notices, so builds do not depend on Google Fonts being reachable.

## Vercel

Import the repository and use these project settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | `web` |
| Node.js | 24.x |
| Include files outside the root directory | Enabled |
| Install command | `npm ci --prefix ..` |
| Build command | `npm run build` |
| Output directory | Framework default |
| Environment variables | None required |

The committed [web/vercel.json](../web/vercel.json) supplies the install and build commands. Security headers are defined once in [next.config.mjs](../web/next.config.mjs).

Use a preview deployment to check all five routes and interactions before promoting a production deployment. SOC server secrets must never be added as `NEXT_PUBLIC_*` variables.

Reference: [Vercel monorepos](https://vercel.com/docs/monorepos) and [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

## Docker

Build from the **repository root**, because npm workspaces share the root lockfile:

```bash
docker build -f web/Dockerfile -t blusoc-web .
docker run --rm --name blusoc-web -p 127.0.0.1:3000:3000 blusoc-web
```

The multi-stage image runs the standalone Next.js output as a dedicated user and includes a local HTTP health check. Keep port 3000 behind your reverse proxy.

## After deploying

Open the overview, pipeline, stack directory, incident walkthrough, and fatigue lab. Run a pipeline scenario, switch its outcome, open a stage, and toggle a lab rule. Check the mobile navigation and confirm there are no failed asset requests.

The demos remain simulations after deployment. They do not connect a public browser to Wazuh, IRIS, or a containment API.
