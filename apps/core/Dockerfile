# Development image: source code is bind-mounted by docker compose.
# Build context: repo root (npm workspaces, see docker-compose.yml).
FROM node:24.21.0-trixie-slim

# procps: `ps` is used by nest --watch to stop the old process on restart
RUN apt-get update \
  && apt-get install -y --no-install-recommends procps \
  && rm -rf /var/lib/apt/lists/*

ENV NPM_WORKSPACE=@platform/core
WORKDIR /app

# every workspace manifest: npm ci checks the lock against all of them,
# then installs only NPM_WORKSPACE (and the workspace packages it links)
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/messaging/package.json packages/messaging/
COPY apps/core/package.json apps/core/
COPY apps/client/package.json apps/client/
COPY apps/ai-enrichment/package.json apps/ai-enrichment/
RUN npm ci --no-audit --no-fund --workspace=$NPM_WORKSPACE \
  && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.package-lock.sha256

COPY --chmod=755 infra/docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
COPY packages packages
COPY apps/core apps/core

WORKDIR /app/apps/core
EXPOSE 3000

ENTRYPOINT ["dev-entrypoint.sh"]
# 1. build the shared packages (@platform/contracts, @platform/messaging) once,
#    then keep `tsc -b --watch` running in the background so changes in them
#    are rebuilt (Core owns this watcher for all services in development)
# 2. apply migrations, then start Nest in watch mode
CMD ["sh", "-c", "npm run build:packages --prefix /app && (npm run watch:packages --prefix /app &) && npm run migration:run && npm run start:dev"]
