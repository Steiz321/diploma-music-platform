# Development image: source code is bind-mounted by docker compose.
# Build context: ./server, extra context "infra": ./infra/docker (see docker-compose.yml).
FROM node:24.21.0-trixie-slim

# ffmpeg: re-encodes audio files over the Groq upload limit before transcription
# procps: `ps` is used by nest --watch to stop the old process on restart
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg procps \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
  && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.package-lock.sha256

COPY --from=infra --chmod=755 dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
COPY . .

EXPOSE 3000

ENTRYPOINT ["dev-entrypoint.sh"]
# apply migrations, then start Nest in watch mode
CMD ["sh", "-c", "npm run migration:run && npm run start:dev"]
