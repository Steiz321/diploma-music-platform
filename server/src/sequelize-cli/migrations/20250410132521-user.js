/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE TYPE user_type AS ENUM ('user', 'admin');`,
        {
          transaction: t,
        },
      );

      await queryInterface.createTable(
        'user',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          avatar: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          is_verified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
      await queryInterface.dropTable('user', { transaction: t });

      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS user_type;`, {
        transaction: t,
      });
    }),
};
