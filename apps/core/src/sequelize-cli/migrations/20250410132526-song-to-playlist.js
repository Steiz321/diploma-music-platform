/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'song_to_playlist',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          song_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'song',
              key: 'id',
            },
          },
          playlist_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'playlist',
              key: 'id',
            },
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction: t },
      );
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('song_to_playlist', { transaction: t });
    }),
};
