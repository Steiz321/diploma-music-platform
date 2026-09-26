/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'like_to_song',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'user',
              key: 'id',
            },
          },
          song_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'song',
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
      await queryInterface.dropTable('like_to_song', { transaction: t });
    }),
};
