/**
 * Indexes on foreign keys. Postgres does not create them automatically.
 * like_to_song.user_id and like_to_playlist.user_id are already covered by
 * the (user_id, song_id / playlist_id) unique indexes.
 */
const INDEXES = [
  { table: 'like_to_song', fields: ['song_id'] },
  { table: 'like_to_playlist', fields: ['playlist_id'] },
  { table: 'listens', fields: ['song_id'] },
  // listening history of a user, newest first
  { table: 'listens', fields: ['user_id', 'created_at'] },
  { table: 'song', fields: ['user_id'] },
  { table: 'playlist', fields: ['user_id'] },
  { table: 'song_to_playlist', fields: ['playlist_id'] },
  { table: 'song_to_playlist', fields: ['song_id'] },
  { table: 'comment', fields: ['song_id'] },
  { table: 'comment', fields: ['user_id'] },
  // credentials are 1:1 with user
  { table: 'user_auth', fields: ['user_id'], unique: true },
  { table: 'subscription', fields: ['subscriber_id'] },
  { table: 'subscription', fields: ['channel_id'] },
];

const indexName = ({ table, fields, unique }) =>
  `${table}_${fields.join('_')}${unique ? '_unique' : '_idx'}`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      for (const index of INDEXES) {
        await queryInterface.addIndex(index.table, index.fields, {
          name: indexName(index),
          unique: Boolean(index.unique),
          transaction: t,
        });
      }
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      for (const index of INDEXES) {
        await queryInterface.removeIndex(index.table, indexName(index), {
          transaction: t,
        });
      }
    }),
};
