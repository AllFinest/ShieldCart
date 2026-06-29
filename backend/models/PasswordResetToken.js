/**
 * Password Reset Token Model
 *
 * Persists password reset requests with a database-backed store and
 * an in-memory fallback for development when MySQL is unavailable.
 */

const crypto = require('crypto');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

let memoryTokens = [];
let useMemory = false;

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('Password reset token model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

function normalizeExpiry(expiresAt) {
  return expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
}

async function create({ userId, tokenHash, expiresAt }) {
  const normalizedExpiresAt = normalizeExpiry(expiresAt);

  if (useMemory) {
    memoryTokens = memoryTokens.filter((token) => token.user_id !== userId || token.used);
    const record = {
      id: crypto.randomUUID(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: normalizedExpiresAt,
      used: 0,
      created_at: new Date(),
    };
    memoryTokens.push(record);
    return record;
  }

  await pool.execute(
    'DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0',
    [userId]
  );

  const [result] = await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
     VALUES (?, ?, ?, 0)`,
    [userId, tokenHash, normalizedExpiresAt]
  );

  return {
    id: result.insertId,
    user_id: userId,
    token_hash: tokenHash,
    expires_at: normalizedExpiresAt,
    used: 0,
  };
}

module.exports = {
  create,
};
