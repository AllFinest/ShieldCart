/**
 * Server Entry Point
 *
 * Loads environment variables, initializes the database connection,
 * and starts the Express HTTP server.
 *
 * This file is intentionally minimal — all app configuration
 * lives in app.js for clean separation of concerns.
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

/**
 * Start the server after verifying database connectivity.
 */
async function startServer() {
  // Test database connection (non-blocking — server starts even if DB is down)
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn('Server starting without database connection. Some features will be unavailable.');
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
}

// Handle uncaught exceptions — log and exit gracefully
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason });
  process.exit(1);
});

startServer();
