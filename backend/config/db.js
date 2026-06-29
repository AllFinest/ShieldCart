/**
 * Database Configuration
 *
 * Uses mysql2 connection pool with prepared statements to prevent SQL injection.
 * Connection pooling improves performance by reusing database connections
 * instead of creating a new one for every query.
 */

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Create a connection pool — connections are reused across requests
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'ecommerce_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure_ecommerce',

  // Pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Security: reject unauthorized SSL connections in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,

  // Timezone handling
  timezone: '+00:00',

  // Enable multiple statements only if explicitly needed (disabled for security)
  multipleStatements: false,
});

/**
 * Test database connectivity at startup.
 * Logs success or failure so operators know immediately if the DB is unreachable.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('MySQL database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('MySQL connection failed:', { message: error.message });
    return false;
  }
}

module.exports = { pool, testConnection };
