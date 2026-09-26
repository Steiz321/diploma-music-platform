# Development image: source code is bind-mounted by docker compose.
# Build context: ./client, extra context "infra": ./infra/docker (see docker-compose.yml).
FROM node:24.21.0-trixie-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
  && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.package-lock.sha256

COPY --from=infra --chmod=755 dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
COPY . .

# vite.config.ts: port 5000, host: true
EXPOSE 5000

ENTRYPOINT ["dev-entrypoint.sh"]
CMD ["npm", "run", "dev"]
