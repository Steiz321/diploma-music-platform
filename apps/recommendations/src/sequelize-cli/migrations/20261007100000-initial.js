/**
 * Database of the Recommendations service. Tag vectors of tracks and user
 * profiles live in pgvector columns; their size is the length of
 * TAG_VECTOR_KEYS (vocabulary version 1), so a new vocabulary version needs a
 * migration.
 */
const DIMENSIONS = 36;

const UP = `
  -- created by infra/postgres/init as superuser; fails clearly elsewhere
  CREATE EXTENSION IF NOT EXISTS vector;

  -- catalogue from song.uploaded / song.enriched / song.deleted
  CREATE TABLE tracks (
    song_id            integer PRIMARY KEY,
    author_id          integer,
    tags               jsonb,
    tag_vector         vector(${DIMENSIONS}),
    vocabulary_version integer,
    uploaded_at        timestamptz,
    deleted_at         timestamptz
  );
  -- nearest tracks by cosine distance (similar tracks, content part)
  CREATE INDEX tracks_tag_vector_idx ON tracks USING hnsw (tag_vector vector_cosine_ops);

  -- preference profiles from profile.updated (Analytics)
  CREATE TABLE user_profiles (
    user_id            integer PRIMARY KEY,
    vector             vector(${DIMENSIONS}) NOT NULL,
    top_tags           jsonb,
    vocabulary_version integer NOT NULL,
    updated_at         timestamptz NOT NULL
  );

  -- implicit scores from scores.updated (Analytics): the collaborative signal
  CREATE TABLE user_scores (
    user_id    integer NOT NULL,
    song_id    integer NOT NULL,
    score      double precision NOT NULL,
    updated_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, song_id)
  );
  CREATE INDEX user_scores_song_id_idx ON user_scores (song_id);

  CREATE TABLE processed_events (
    event_id     uuid PRIMARY KEY,
    processed_at timestamptz NOT NULL DEFAULT now()
  );

  -- the service publishes nothing yet; the table is required by MessagingModule
  CREATE TABLE outbox_events (
    id             uuid PRIMARY KEY,
    event_type     varchar(255) NOT NULL,
    aggregate_type varchar(255) NOT NULL,
    aggregate_id   varchar(255) NOT NULL,
    payload        jsonb NOT NULL,
    occurred_at    timestamptz NOT NULL,
    published_at   timestamptz,
    attempts       integer NOT NULL DEFAULT 0,
    last_error     text
  );
  CREATE INDEX outbox_events_unpublished_idx ON outbox_events (occurred_at)
    WHERE published_at IS NULL;
`;

const DOWN = `
  DROP TABLE outbox_events, processed_events, user_scores, user_profiles, tracks;
`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) =>
    queryInterface.sequelize.transaction((t) =>
      queryInterface.sequelize.query(UP, { transaction: t }),
    ),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction((t) =>
      queryInterface.sequelize.query(DOWN, { transaction: t }),
    ),
};
