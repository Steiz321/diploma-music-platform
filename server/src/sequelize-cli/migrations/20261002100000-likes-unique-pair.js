/**
 * Likes are soft-deleted: one row per user–song (user–playlist) pair,
 * unlike sets deleted_at and a repeated like clears it.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      for (const [table, column] of [
        ['like_to_song', 'song_id'],
        ['like_to_playlist', 'playlist_id'],
      ]) {
        // keep one row per pair: an active one if there is any, else the oldest
        await queryInterface.sequelize.query(
          `DELETE FROM ${table} a
            USING ${table} b
            WHERE a.user_id = b.user_id
              AND a.${column} = b.${column}
              AND (a.deleted_at IS NOT NULL, a.id) > (b.deleted_at IS NOT NULL, b.id);`,
          { transaction: t },
        );

        await queryInterface.addIndex(table, ['user_id', column], {
          name: `${table}_user_id_${column}_unique`,
          unique: true,
          transaction: t,
        });
      }
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'like_to_song',
        'like_to_song_user_id_song_id_unique',
        { transaction: t },
      );
      await queryInterface.removeIndex(
        'like_to_playlist',
        'like_to_playlist_user_id_playlist_id_unique',
        { transaction: t },
      );
    }),
};
