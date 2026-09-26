/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'subscription',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          subscriber_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'user',
              key: 'id',
            },
          },
          channel_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'user',
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
      await queryInterface.dropTable('subscription', { transaction: t });
    }),
};
