/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE TYPE transcription_status AS ENUM ('pending', 'done', 'failed', 'no_lyrics');`,
        { transaction: t },
      );

      // raw structured result of the transcription port
      await queryInterface.addColumn(
        'song',
        'transcription',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'song',
        'transcription_status',
        {
          type: 'transcription_status',
          allowNull: false,
          defaultValue: 'pending',
        },
        { transaction: t },
      );

      // detected language of the lyrics, ISO-639-1 when known
      await queryInterface.addColumn(
        'song',
        'language',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
    }),
  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('song', 'language', { transaction: t });
      await queryInterface.removeColumn('song', 'transcription_status', {
        transaction: t,
      });
      await queryInterface.removeColumn('song', 'transcription', {
        transaction: t,
      });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS transcription_status;`,
        { transaction: t },
      );
    }),
};
