# Музична платформа

Музична платформа (типу SoundCloud): Core — модульний моноліт на NestJS, React SPA, PostgreSQL, S3-сумісне сховище (MinIO), RabbitMQ для доменних подій (transactional outbox) і транскрипція текстів пісень через Groq Whisper.
Детальний технічний опис кодової бази — у [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

## Швидкий старт

Потрібен лише Docker (Docker Desktop з Compose v2).

```bash
docker compose up
```

Перший запуск збирає образи (кілька хвилин). Далі все піднімається без ручних дій:
PostgreSQL, MinIO, RabbitMQ → створення бакета і mock-зображень → збірка `@platform/contracts` → міграції → Core у watch-режимі → клієнт.

| Що | Адреса |
|---|---|
| Клієнт (React, Vite) | http://localhost:5173 |
| API (NestJS) | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Health check (БД + RabbitMQ) | http://localhost:3000/health |
| RabbitMQ management UI | http://localhost:15672, `platform` / `platform-secret` |
| Файли (MinIO S3 API, публічне читання) | http://localhost:9000/music-files/&lt;key&gt; |
| PostgreSQL | `localhost:5432`, БД/користувач/пароль `music` |

Код `apps/core/`, `apps/client/` і `packages/` примонтовано в контейнери: зміни підхоплюються без перезапуску (Nest watch, Vite HMR).

### Корисні команди

```bash
docker compose up -d                 # у фоні
docker compose logs -f core          # логи Core
docker compose down                  # зупинити (дані лишаються)
docker compose down -v               # зупинити і стерти БД та файли
docker compose up --build            # перезібрати образи (напр. після зміни Dockerfile)

docker compose exec core npm run migration:create -- <name>  # нова міграція
docker compose exec core npm run migration:undo              # відкотити останню
docker compose exec core npm run schema:check                # моделі Sequelize == таблиці БД
docker compose exec core npm test                            # unit-тести (Jest)

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
| `TRANSCRIPTION_PROVIDER` | `fake` | `fake` — записана відповідь Groq з `apps/core/fixtures/transcription.json`; `groq` — реальна транскрипція |
| `GROQ_API_KEY` | — | ключ Groq, потрібен лише для `groq` |
| `FAKE_TRANSCRIPTION_DELAY_MS` | `1000` | штучна затримка фейкового провайдера |
| `CLIENT_PORT`, `SERVER_PORT`, `POSTGRES_PORT`, `MINIO_PORT` | `5173`, `3000`, `5432`, `9000` | порти на хості |
| `RABBITMQ_PORT`, `RABBITMQ_MANAGEMENT_PORT` | `5672`, `15672` | AMQP і management UI на хості |
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | `platform`, `platform-secret` | облікові дані RabbitMQ |
| `LOG_LEVEL` | `info` | рівень логів Core (pino) |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | `minio`, `minio-secret` | облікові дані MinIO (і S3-ключі сервера) |
| `ENCRYPTION_KEY` | dev-значення | ключ шифрування хешів паролів, рівно 32 символи |
| `JWT_SECRET_KEY` | dev-значення | підпис JWT |
| `API_DOCS_USER`, `API_DOCS_PASSWORD` | порожньо | basic auth для `/docs` (порожньо — відкрито) |

Повний список змінних Core (БД, S3, SSL тощо) — у [apps/core/.env.example](apps/core/.env.example).
Змінні оточення завжди мають пріоритет над `apps/core/.env`.

## Транскрипція: перемикання на реальний Groq

1. Отримайте ключ на https://console.groq.com/keys.
2. У кореневому `.env`:
   ```env
   TRANSCRIPTION_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   ```
3. Перезапустіть Core: `docker compose up -d core`.

Як це працює:
- пісня зберігається одразу зі статусом `pending`, потім синхронно транскрибується;
- файл береться з MinIO і відправляється в Groq multipart-запитом (модель `whisper-large-v3`, `verbose_json`, мова визначається автоматично);
- файли більші за 24 MB перекодовуються ffmpeg у mp3 16 kHz mono 64 kbps;
- на `429` — до 3 спроб з урахуванням `retry-after`;
- результат: `song.text` (текст по рядках, порожній рядок між строфами), `song.transcription` (сирий JSON із сегментами), `song.language`, `song.transcription_status` = `done | no_lyrics | failed`.
  Помилка транскрипції не ламає завантаження пісні — статус `failed`, причина в логах сервера.

## Доменні події (RabbitMQ)

Core публікує доменні події в RabbitMQ через **transactional outbox**:

1. Use case пише подію в таблицю `outbox_events` у тій самій транзакції, що й зміну даних (`OutboxPort.add`).
2. Релей (`@nestjs/schedule`, раз на `OUTBOX_RELAY_INTERVAL_MS`, по `OUTBOX_RELAY_BATCH_SIZE` подій) у транзакції бере неопубліковані події (`FOR UPDATE SKIP LOCKED`, від найстаріших), публікує кожну з очікуванням publisher confirm і ставить `published_at`.
3. Якщо брокер недоступний — `attempts += 1`, `last_error`, подія лишається в черзі на наступний цикл. Core при цьому працює далі.
4. Опубліковані події старші за 7 днів видаляються раз на добу.

Доставка — at-least-once: споживачі мають дедуплікувати за `event_id`.

| Exchange | Тип | Призначення |
|---|---|---|
| `platform.events` | topic, durable | усі доменні події; routing key = тип події |
| `platform.dlx` | topic, durable | для dead-letter черг майбутніх споживачів |

| Подія | Коли | Payload |
|---|---|---|
| `user.registered` | реєстрація | `user_id` |
| `song.uploaded` | створення пісні | `song_id`, `author_id`, `audio_key` (ключ у MinIO), `title` |
| `song.deleted` | видалення пісні | `song_id`, `author_id` |
| `song.liked` / `song.unliked` | лайк / анлайк | `song_id`, `user_id` |
| `playlist.song_added` / `playlist.song_removed` | пісня в плейлисті | `playlist_id`, `song_id`, `user_id` |

Envelope і типи — у пакеті [`@platform/contracts`](packages/contracts/src). Повідомлення persistent, `content-type: application/json`, `message_id` = `event_id`, `type` = тип події, заголовок `correlation_id` = request id HTTP-запиту, з якого подія виникла (той самий `req.id` є в JSON-логах Core; його можна передати заголовком `x-request-id`).

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
npm run dev:core                                  # збирає contracts і стартує Core

VITE_API_URL=http://localhost:3000 npm run dev:client   # http://localhost:5000
```

Для керованої хмарної БД: `DB_SSL=true` (і `DB_SSL_REJECT_UNAUTHORIZED=false` лише для самопідписаних сертифікатів).

## Структура

Монорепозиторій на npm workspaces (без Nx/Turborepo), один `package-lock.json` у корені.

```
apps/core/              Core: NestJS API (Sequelize, міграції в src/sequelize-cli)
apps/core/fixtures/     записана відповідь Groq для фейкового провайдера
apps/client/            React SPA (Vite, MUI)
packages/contracts/     @platform/contracts: спільні контракти подій
infra/minio/            ініціалізація бакета, публічна політика, mock-зображення
infra/docker/           dev-entrypoint для Node-контейнерів
docker-compose.yml      локальне оточення
```

Залежності ставляться з кореня: `npm install <pkg> -w @platform/core`.

## Відомі нюанси

- `GET /health` повертає 503, коли недоступна БД або RabbitMQ; це healthcheck контейнера Core.
- Офіційні образи `minio/minio` і `minio/mc` більше не публікуються на Docker Hub, тому використовуються заморожені збірки `bitnamilegacy/minio` і `bitnamilegacy/minio-client` (закріплені за тегом). Для локальної розробки цього достатньо. Ця збірка MinIO не містить веб-консолі — для перегляду файлів використовуйте `mc` (команда вище).
- Клієнт опубліковано на порту 5173, бо 5000 на macOS зайнятий AirPlay Receiver.
- `npm run build` у `apps/client/` падає на 12 старих помилках TypeScript у сторінках (невикористані змінні тощо); dev-сервер це не зачіпає.
