/**
 * Transactional outbox: domain events are written here in the same
 * transaction as the data change and published to RabbitMQ by the relay.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'outbox_events',
        {
          // = event_id of the envelope
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          event_type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          aggregate_type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          aggregate_id: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          // the full envelope, published as is
          payload: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
          occurred_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          published_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          attempts: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          last_error: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
        },
        { transaction: t },
      );

      // the relay reads only unpublished events, oldest first
      await queryInterface.addIndex('outbox_events', ['occurred_at'], {
        name: 'outbox_events_unpublished_idx',
        where: { published_at: null },
        transaction: t,
      });
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('outbox_events', { transaction: t });
    }),
};
