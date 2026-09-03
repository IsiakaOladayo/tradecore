const app    = require('./app');
const logger = require('./lib/logger');
const db     = require('./lib/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await db.query('SELECT 1'); // confirm db connection
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`TradeCore API running on port ${PORT}`, {
        env:    process.env.NODE_ENV || 'development',
        region: process.env.AWS_REGION || 'local',
      });
    });
  } catch (err) {
    logger.error('Failed to start', { err: err.message });
    process.exit(1);
  }
}

start();

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  process.exit(0);
});
