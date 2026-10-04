# Музична платформа

Музична платформа (типу SoundCloud): Core — модульний моноліт на NestJS, сервіс **AI enrichment** (транскрипція Groq Whisper і аналіз тексту Groq LLM), React SPA, PostgreSQL, S3-сумісне сховище (MinIO) і RabbitMQ для доменних подій (transactional outbox).
Детальний технічний опис кодової бази — у [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

## Швидкий старт

Потрібен лише Docker (Docker Desktop з Compose v2).

```bash
docker compose up
```

Перший запуск збирає образи (кілька хвилин). Далі все піднімається без ручних дій:
PostgreSQL (+ база `ai_enrichment`), MinIO, RabbitMQ → створення бакета і mock-зображень → збірка `@platform/contracts` і `@platform/messaging` → міграції → Core у watch-режимі → AI enrichment і клієнт.

| Що | Адреса |
|---|---|
| Клієнт (React, Vite) | http://localhost:5173 |
| API (NestJS) | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Health check Core (БД + RabbitMQ) | http://localhost:3000/health |
| Health check AI enrichment | http://localhost:3001/health |
| RabbitMQ management UI | http://localhost:15672, `platform` / `platform-secret` |
| Файли (MinIO S3 API, публічне читання) | http://localhost:9000/music-files/&lt;key&gt; |
| PostgreSQL | `localhost:5432`: БД Core `music` (користувач/пароль `music`), БД AI enrichment `ai_enrichment` (`ai_enrichment` / `ai-enrichment`) |

Код `apps/*` і `packages/` примонтовано в контейнери: зміни підхоплюються без перезапуску (Nest watch, Vite HMR). Спільні пакети компілює і стежить за ними контейнер Core.

### Корисні команди

```bash
docker compose up -d                 # у фоні
docker compose logs -f core          # логи Core
docker compose logs -f ai-enrichment # логи AI enrichment
docker compose down                  # зупинити (дані лишаються)
docker compose down -v               # зупинити і стерти БД та файли
docker compose up --build            # перезібрати образи (напр. після зміни Dockerfile)

docker compose exec core npm run migration:create -- <name>  # нова міграція
docker compose exec core npm run migration:undo              # відкотити останню
docker compose exec core npm run schema:check                # моделі Sequelize == таблиці БД
docker compose exec core npm test                            # unit-тести (Jest)
docker compose exec ai-enrichment npm test                   # unit-тести AI enrichment
npm test                                                     # усі тести з кореня (на хості)

# вміст бакета (у цій збірці MinIO немає веб-консолі)
docker compose run --rm -e MC_HOST_local=http://minio:minio-secret@minio:9000 --entrypoint mc minio-init ls -r local/music-files
```

Після зміни кореневого `package-lock.json` залежності в контейнері перевстановлюються автоматично при наступному старті.

## Змінні оточення

Кореневий `.env` **необов'язковий**: у `docker-compose.yml` для всього є локальні значення за замовчуванням.
Щоб змінити їх або додати секрети — скопіюйте приклад:

```bash
cp .env.example .env
```

| Змінна | За замовчуванням | Призначення |
|---|---|---|
| `TRANSCRIPTION_PROVIDER` | `fake` | AI enrichment: `fake` — записана відповідь Groq з `apps/ai-enrichment/fixtures/transcription.json`; `groq` — реальна транскрипція |
| `LLM_PROVIDER` | `fake` | AI enrichment: `fake` — детермінований аналіз без мережі; `groq` — `openai/gpt-oss-120b` |
| `GROQ_API_KEY` | — | ключ Groq, потрібен лише для `groq` |
| `FAKE_TRANSCRIPTION_DELAY_MS`, `FAKE_LLM_DELAY_MS` | `1000`, `500` | штучні затримки фейкових провайдерів |
| `CLIENT_PORT`, `SERVER_PORT`, `AI_ENRICHMENT_PORT`, `POSTGRES_PORT`, `MINIO_PORT` | `5173`, `3000`, `3001`, `5432`, `9000` | порти на хості |
| `AI_ENRICHMENT_DB_PASSWORD` | `ai-enrichment` | пароль користувача БД `ai_enrichment` |
| `RABBITMQ_PORT`, `RABBITMQ_MANAGEMENT_PORT` | `5672`, `15672` | AMQP і management UI на хості |
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | `platform`, `platform-secret` | облікові дані RabbitMQ |
| `LOG_LEVEL` | `info` | рівень логів Core і AI enrichment (pino) |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | `minio`, `minio-secret` | облікові дані MinIO (і S3-ключі сервера) |
| `ENCRYPTION_KEY` | dev-значення | ключ шифрування хешів паролів, рівно 32 символи |
| `JWT_SECRET_KEY` | dev-значення | підпис JWT |
| `API_DOCS_USER`, `API_DOCS_PASSWORD` | порожньо | basic auth для `/docs` (порожньо — відкрито) |

Повний список змінних сервісів — у [apps/core/.env.example](apps/core/.env.example) і [apps/ai-enrichment/.env.example](apps/ai-enrichment/.env.example).
Змінні оточення завжди мають пріоритет над `.env` сервісу.

## AI enrichment: транскрипція і аналіз тексту

Окремий сервіс [`apps/ai-enrichment`](apps/ai-enrichment) з власною БД `ai_enrichment`. `POST /song` більше не чекає на транскрипцію: пісня зберігається зі статусом `pending` і відповідь повертається одразу, а обробка йде асинхронно:

1. Core публікує `song.uploaded`; AI enrichment читає його з черги `ai-enrichment.song-uploaded` (по одному повідомленню — ліміти Groq).
2. Аудіо завантажується з MinIO за `audio_key` і транскрибується Groq Whisper (`whisper-large-v3`, `verbose_json`, мова визначається автоматично; файли > 24 MB перекодовуються ffmpeg).
3. Текст аналізує Groq LLM (`openai/gpt-oss-120b`, structured outputs у strict-режимі): строфи з типами (`verse`, `chorus`, …) і таймкодами рядків, прибирання артефактів Whisper, теги зі словника `TAG_VOCABULARY` у [`@platform/contracts`](packages/contracts/src/tags.ts) — настрій, тематика, енергія, мова.
4. Результат публікується подією `song.enriched` (або `song.enrichment_failed`, якщо немає навіть транскрипції); Core оновлює пісню: `text`, `lyrics`, `tags`, `transcription_status` = `done | no_lyrics | failed`.

Помилки: `429`, мережа і `5xx` Groq — до 3 спроб з урахуванням `retry-after`. Якщо не вдався лише аналіз — пісня отримує текст без строф і тегів. Повторна доставка тієї самої події ігнорується (inbox `processed_events`). Некоректне повідомлення потрапляє в dead-letter чергу `<черга>.dlq`.

### Перемикання на реальний Groq

1. Отримайте ключ на https://console.groq.com/keys.
2. У кореневому `.env`:
   ```env
   TRANSCRIPTION_PROVIDER=groq
   LLM_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   ```
3. Перезапустіть сервіс: `docker compose up -d ai-enrichment`.

Ліміти безкоштовного тарифу: 20 транскрипцій/хв, 30 запитів до LLM/хв і 8K токенів/хв — велика партія пісень обробляється повільно, але без втрат.

### Існуючий том Postgres

База `ai_enrichment` створюється скриптом [`infra/postgres/init`](infra/postgres/init) лише при створенні тому. Якщо том з'явився раніше, ніж цей сервіс, — або `docker compose down -v` (стирає дані), або один раз:

```bash
docker compose exec postgres psql -U music -d music \
  -c "CREATE USER ai_enrichment WITH PASSWORD 'ai-enrichment';" \
  -c "CREATE DATABASE ai_enrichment OWNER ai_enrichment;" \
  -c "REVOKE CONNECT ON DATABASE ai_enrichment FROM PUBLIC;"
docker compose restart ai-enrichment
```

## Доменні події (RabbitMQ)

Сервіси публікують доменні події в RabbitMQ через **transactional outbox** (спільний код — пакет [`@platform/messaging`](packages/messaging/src)):

1. Use case пише подію в таблицю `outbox_events` у тій самій транзакції, що й зміну даних (`OutboxPort.add`).
2. Релей (`@nestjs/schedule`, раз на `OUTBOX_RELAY_INTERVAL_MS`, по `OUTBOX_RELAY_BATCH_SIZE` подій) у транзакції бере неопубліковані події (`FOR UPDATE SKIP LOCKED`, від найстаріших), публікує кожну з очікуванням publisher confirm і ставить `published_at`.
3. Якщо брокер недоступний — `attempts += 1`, `last_error`, подія лишається в черзі на наступний цикл. Core при цьому працює далі.
4. Опубліковані події старші за 7 днів видаляються раз на добу.

Доставка — at-least-once: споживачі мають дедуплікувати за `event_id`.

| Exchange | Тип | Призначення |
|---|---|---|
| `platform.events` | topic, durable | усі доменні події; routing key = тип події |
| `platform.dlx` | topic, durable | dead-letter: відхилені повідомлення черги `X` потрапляють у `X.dlq` |

| Черга | Сервіс | Події |
|---|---|---|
| `ai-enrichment.song-uploaded` | AI enrichment | `song.uploaded` |
| `core.song-enrichment` | Core | `song.enriched`, `song.enrichment_failed` |

| Подія | Коли | Payload |
|---|---|---|
| `user.registered` | реєстрація | `user_id` |
| `song.uploaded` | створення пісні | `song_id`, `author_id`, `audio_key` (ключ у MinIO), `title` |
| `song.deleted` | видалення пісні | `song_id`, `author_id` |
| `song.liked` / `song.unliked` | лайк / анлайк | `song_id`, `user_id` |
| `playlist.song_added` / `playlist.song_removed` | пісня в плейлисті | `playlist_id`, `song_id`, `user_id` |
| `song.enriched` | AI enrichment обробив пісню | `song_id`, `status` (`done` \| `no_lyrics`), `transcription`, `text`, `lyrics`, `tags`, `vocabulary_version`, `models` |
| `song.enrichment_failed` | немає навіть транскрипції | `song_id`, `stage` (`download` \| `transcription`), `reason`, `attempts` |

Envelope і типи — у пакеті [`@platform/contracts`](packages/contracts/src). Повідомлення persistent, `content-type: application/json`, `message_id` = `event_id`, `type` = тип події, заголовок `correlation_id` = request id HTTP-запиту, з якого почався ланцюжок (його можна передати заголовком `x-request-id`). Події, створені під час обробки іншої події, успадковують її `correlation_id`, тож HTTP-запит → `song.uploaded` → `song.enriched` → оновлення пісні простежуються за одним id у JSON-логах обох сервісів (поле `correlation_id`).

Подивитися події локально: у management UI створіть чергу, прив'яжіть її до `platform.events` з ключем `#` і читайте повідомлення через **Get messages**. Або через HTTP API:

```bash
curl -u platform:platform-secret -H 'content-type: application/json' -X PUT \
  localhost:15672/api/queues/%2F/debug -d '{"durable":true}'
curl -u platform:platform-secret -H 'content-type: application/json' -X POST \
  localhost:15672/api/bindings/%2F/e/platform.events/q/debug -d '{"routing_key":"#"}'
curl -u platform:platform-secret -H 'content-type: application/json' -X POST \
  localhost:15672/api/queues/%2F/debug/get -d '{"count":10,"ackmode":"ack_requeue_false","encoding":"auto"}'
```

## Запуск без Docker

Потрібні Node.js з [.nvmrc](.nvmrc), ffmpeg (для Groq і файлів > 24 MB), доступні PostgreSQL, S3/MinIO і RabbitMQ.

```bash
npm ci                                            # усі workspaces з кореня
cp apps/core/.env.example apps/core/.env          # заповнити значення
npm run migration:run -w @platform/core
npm run dev:core                                  # збирає спільні пакети і стартує Core

cp apps/ai-enrichment/.env.example apps/ai-enrichment/.env   # потрібна БД ai_enrichment
npm run migration:run -w @platform/ai-enrichment
npm run dev:ai

VITE_API_URL=http://localhost:3000 npm run dev:client   # http://localhost:5000
```

Для керованої хмарної БД: `DB_SSL=true` (і `DB_SSL_REJECT_UNAUTHORIZED=false` лише для самопідписаних сертифікатів).

## Структура

Монорепозиторій на npm workspaces (без Nx/Turborepo), один `package-lock.json` у корені.

```
apps/core/              Core: NestJS API (Sequelize, міграції в src/sequelize-cli)
apps/ai-enrichment/     AI enrichment: транскрипція і аналіз тексту (власна БД і міграції)
apps/ai-enrichment/fixtures/  записана відповідь Groq для фейкового провайдера
apps/client/            React SPA (Vite, MUI)
packages/contracts/     @platform/contracts: контракти подій, словник тегів (без runtime-залежностей)
packages/messaging/     @platform/messaging: RabbitMQ, outbox і релей, inbox, request context, логи
infra/postgres/         init-скрипт: база і користувач AI enrichment
infra/minio/            ініціалізація бакета, публічна політика, mock-зображення
infra/docker/           dev-entrypoint для Node-контейнерів
docker-compose.yml      локальне оточення
```

Залежності ставляться з кореня: `npm install <pkg> -w @platform/core`.

## Відомі нюанси

- `GET /health` Core і AI enrichment повертає 503, коли недоступна БД або RabbitMQ; це healthcheck контейнерів.
- У dev-оточенні AI enrichment стартує після healthy Core: контейнер Core компілює спільні пакети.
- Офіційні образи `minio/minio` і `minio/mc` більше не публікуються на Docker Hub, тому використовуються заморожені збірки `bitnamilegacy/minio` і `bitnamilegacy/minio-client` (закріплені за тегом). Для локальної розробки цього достатньо. Ця збірка MinIO не містить веб-консолі — для перегляду файлів використовуйте `mc` (команда вище).
- Клієнт опубліковано на порту 5173, бо 5000 на macOS зайнятий AirPlay Receiver.
- `npm run build` у `apps/client/` падає на 12 старих помилках TypeScript у сторінках (невикористані змінні тощо); dev-сервер це не зачіпає.
