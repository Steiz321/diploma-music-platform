#!/bin/sh
# Database per service: the Recommendations service gets its own database and
# user, with the pgvector extension (creating it needs a superuser).
# Runs only when the Postgres volume is created (docker-entrypoint-initdb.d);
# for an existing volume see README ("Існуючий том Postgres").
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER recommendations WITH PASSWORD '${RECOMMENDATIONS_DB_PASSWORD}';
  CREATE DATABASE recommendations OWNER recommendations;
  REVOKE CONNECT ON DATABASE recommendations FROM PUBLIC;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname recommendations <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS vector;
EOSQL
