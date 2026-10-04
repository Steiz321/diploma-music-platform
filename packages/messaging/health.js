// Separate entry point: @nestjs/terminus is ESM-only, so it is not loaded by
// the main entry (Jest tests of the services import that one).
module.exports = require('./dist/rabbitmq/rabbitmq.health');
