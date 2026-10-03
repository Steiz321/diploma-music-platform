# Development image: source code is bind-mounted by docker compose.
# Build context: repo root (npm workspaces, see docker-compose.yml).
FROM node:24.21.0-trixie-slim

ENV NPM_WORKSPACE=@platform/client
WORKDIR /app

# every workspace manifest: npm ci checks the lock against all of them,
# then installs only NPM_WORKSPACE (and the workspace packages it links)
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/core/package.json apps/core/
COPY apps/client/package.json apps/client/
RUN npm ci --no-audit --no-fund --workspace=$NPM_WORKSPACE \
  && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.package-lock.sha256

COPY --chmod=755 infra/docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
COPY apps/client apps/client

WORKDIR /app/apps/client
# vite.config.ts: port 5000, host: true
EXPOSE 5000

ENTRYPOINT ["dev-entrypoint.sh"]
CMD ["npm", "run", "dev"]
