# Development image: source code is bind-mounted by docker compose.
# Build context: repo root (npm workspaces, see docker-compose.yml).
FROM node:24.21.0-trixie-slim

# ffmpeg: re-encodes audio files over the Groq upload limit before transcription
# procps: `ps` is used by nest --watch to stop the old process on restart
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg procps \
  && rm -rf /var/lib/apt/lists/*

ENV NPM_WORKSPACE=@platform/core
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
COPY packages/contracts packages/contracts
COPY apps/core apps/core

WORKDIR /app/apps/core
EXPOSE 3000

ENTRYPOINT ["dev-entrypoint.sh"]
# apply migrations, then start Nest in watch mode
CMD ["sh", "-c", "npm run migration:run && npm run start:dev"]
