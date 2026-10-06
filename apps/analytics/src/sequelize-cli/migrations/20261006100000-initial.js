/**
 * Database of the Analytics service: the raw event log, a local copy of the
 * catalogue, listening sessions, user–song state and scores, user profiles,
 * plus the inbox and the transactional outbox (same shape as in Core).
 */
const UP = `
  -- every consumed event as received
  CREATE TABLE raw_events (
    event_id       uuid PRIMARY KEY,
    type           varchar(255) NOT NULL,
    producer       varchar(255) NOT NULL,
    user_id        integer,
    song_id        integer,
    occurred_at    timestamptz NOT NULL,
    received_at    timestamptz NOT NULL DEFAULT now(),
    correlation_id varchar(255),
    payload        jsonb NOT NULL
  );
  CREATE INDEX raw_events_type_occurred_at_idx ON raw_events (type, occurred_at);
  CREATE INDEX raw_events_user_id_occurred_at_idx ON raw_events (user_id, occurred_at);

  -- catalogue as known from song.uploaded / song.enriched / song.deleted
  CREATE TABLE songs (
    song_id            integer PRIMARY KEY,
    author_id          integer,
    tags               jsonb,
    vocabulary_version integer,
    uploaded_at        timestamptz,
    deleted_at         timestamptz
  );

  -- one row per play_id: a listening session of one track
  CREATE TABLE listening_sessions (
    play_id       uuid PRIMARY KEY,
    user_id       integer NOT NULL,
    song_id       integer NOT NULL,
    source        jsonb NOT NULL,
    started_at    timestamptz NOT NULL,
    last_event_at timestamptz NOT NULL,
    last_position double precision NOT NULL DEFAULT 0,
    playing       boolean NOT NULL DEFAULT false,
    -- seconds actually heard (seeks are not counted)
    listened_sec  double precision NOT NULL DEFAULT 0,
    max_position  double precision NOT NULL DEFAULT 0,
    duration_sec  double precision,
    completed     boolean NOT NULL DEFAULT false,
    skipped       boolean NOT NULL DEFAULT false,
    -- skipped in the first 30 s
    skipped_early boolean NOT NULL DEFAULT false,
    events_count  integer NOT NULL DEFAULT 0
  );
  CREATE INDEX listening_sessions_user_id_song_id_idx ON listening_sessions (user_id, song_id);
  CREATE INDEX listening_sessions_song_id_idx ON listening_sessions (song_id);

  -- explicit signals: like state and the playlists of the user the song is in
  CREATE TABLE user_song_state (
    user_id          integer NOT NULL,
    song_id          integer NOT NULL,
    liked            boolean,
    liked_changed_at timestamptz,
    playlist_ids     integer[] NOT NULL DEFAULT '{}',
    PRIMARY KEY (user_id, song_id)
  );
  CREATE INDEX user_song_state_song_id_idx ON user_song_state (song_id);

  -- implicit score per user–song pair and the features it was computed from
  CREATE TABLE user_song_scores (
    user_id       integer NOT NULL,
    song_id       integer NOT NULL,
    score         double precision NOT NULL,
    liked         boolean,
    playlists     integer NOT NULL,
    completions   integer NOT NULL,
    early_skips   integer NOT NULL,
    partial_ratio double precision NOT NULL,
    computed_at   timestamptz NOT NULL,
    PRIMARY KEY (user_id, song_id)
  );

  -- preference profile; changed_at > computed_at means it must be recomputed
  CREATE TABLE user_profiles (
    user_id            integer PRIMARY KEY,
    vector             double precision[],
    vocabulary_version integer,
    top_tags           jsonb,
    scored_songs       integer NOT NULL DEFAULT 0,
    changed_at         timestamptz NOT NULL DEFAULT date_trunc('milliseconds', now()),
    computed_at        timestamptz,
    published_at       timestamptz
  );
  CREATE INDEX user_profiles_pending_idx ON user_profiles (changed_at)
    WHERE computed_at IS NULL OR changed_at > computed_at;

  -- inbox: ids of consumed events, repeated deliveries are ignored
  CREATE TABLE processed_events (
    event_id     uuid PRIMARY KEY,
    processed_at timestamptz NOT NULL DEFAULT now()
  );

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
  DROP TABLE outbox_events, processed_events, user_profiles, user_song_scores,
    user_song_state, listening_sessions, songs, raw_events;
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
