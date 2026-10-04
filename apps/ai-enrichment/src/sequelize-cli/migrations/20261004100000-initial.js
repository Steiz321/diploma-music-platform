/**
 * Database of the AI enrichment service: enrichment results, the inbox of
 * consumed events and the transactional outbox (same shape as in Core).
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE TYPE enrichment_status AS ENUM ('processing', 'done', 'no_lyrics', 'failed');`,
        { transaction: t },
      );

      await queryInterface.createTable(
        'song_enrichments',
        {
          // id of the song in Core (no foreign key: another service's data)
          song_id: { type: Sequelize.INTEGER, primaryKey: true },
          audio_key: { type: Sequelize.TEXT, allowNull: false },
          status: { type: 'enrichment_status', allowNull: false },
          transcription: { type: Sequelize.JSONB, allowNull: true },
          lyrics: { type: Sequelize.JSONB, allowNull: true },
          tags: { type: Sequelize.JSONB, allowNull: true },
          vocabulary_version: { type: Sequelize.INTEGER, allowNull: true },
          attempts: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          last_error: { type: Sequelize.TEXT, allowNull: true },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction: t },
      );

      // inbox: ids of consumed events, repeated deliveries are ignored
      await queryInterface.createTable(
        'processed_events',
        {
          event_id: { type: Sequelize.UUID, primaryKey: true },
          processed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction: t },
      );

      await queryInterface.createTable(
        'outbox_events',
        {
          // = event_id of the envelope
          id: { type: Sequelize.UUID, primaryKey: true },
          event_type: { type: Sequelize.STRING, allowNull: false },
          aggregate_type: { type: Sequelize.STRING, allowNull: false },
          aggregate_id: { type: Sequelize.STRING, allowNull: false },
          // the full envelope, published as is
          payload: { type: Sequelize.JSONB, allowNull: false },
          occurred_at: { type: Sequelize.DATE, allowNull: false },
          published_at: { type: Sequelize.DATE, allowNull: true },
          attempts: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          last_error: { type: Sequelize.TEXT, allowNull: true },
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
      await queryInterface.dropTable('processed_events', { transaction: t });
      await queryInterface.dropTable('song_enrichments', { transaction: t });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS enrichment_status;`,
        { transaction: t },
      );
    }),
};
