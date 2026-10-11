#!/bin/sh
# Database per service: the Analytics service gets its own database and user.
# Runs only when the Postgres volume is created (docker-entrypoint-initdb.d);
# for an existing volume see README ("Існуючий том Postgres").
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER analytics WITH PASSWORD '${ANALYTICS_DB_PASSWORD}';
  CREATE DATABASE analytics OWNER analytics;
  REVOKE CONNECT ON DATABASE analytics FROM PUBLIC;
EOSQL
