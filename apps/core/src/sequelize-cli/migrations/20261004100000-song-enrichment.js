/**
 * AI enrichment results (song.enriched) and the inbox for consumed events.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      // lyrics split into verses with line timings
      await queryInterface.addColumn(
        'song',
        'lyrics',
        { type: Sequelize.JSONB, allowNull: true },
        { transaction: t },
      );

      // tags from the fixed vocabulary of @platform/contracts
      await queryInterface.addColumn(
        'song',
        'tags',
        { type: Sequelize.JSONB, allowNull: true },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'song',
        'vocabulary_version',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t },
      );

      // inbox: ids of consumed events, repeated deliveries are ignored
      await queryInterface.createTable(
        'processed_events',
        {
          event_id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          processed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction: t },
      );
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('processed_events', { transaction: t });
      for (const column of ['vocabulary_version', 'tags', 'lyrics']) {
        await queryInterface.removeColumn('song', column, { transaction: t });
      }
    }),
};
