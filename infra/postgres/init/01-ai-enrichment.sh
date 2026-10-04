#!/bin/sh
# Database per service: the AI enrichment service gets its own database and
# user. Runs only when the Postgres volume is created (docker-entrypoint-initdb.d);
# for an existing volume see README ("Існуючий том Postgres").
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ai_enrichment WITH PASSWORD '${AI_ENRICHMENT_DB_PASSWORD}';
  CREATE DATABASE ai_enrichment OWNER ai_enrichment;
  REVOKE CONNECT ON DATABASE ai_enrichment FROM PUBLIC;
EOSQL
