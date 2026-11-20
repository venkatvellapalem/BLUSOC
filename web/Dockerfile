# Build from the repository root: docker build -f web/Dockerfile -t blusoc-web .
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json ./web/package.json
RUN npm ci --no-audit --no-fund

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1 BLUSOC_STANDALONE=1
COPY web ./web
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN addgroup --system --gid 1001 blusoc && adduser --system --uid 1001 --ingroup blusoc blusoc
COPY --from=builder --chown=blusoc:blusoc /app/web/.next/standalone ./
COPY --from=builder --chown=blusoc:blusoc /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=blusoc:blusoc /app/web/public ./web/public
USER blusoc
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "web/server.js"]
