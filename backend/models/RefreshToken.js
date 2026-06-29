/**
 * Refresh Token Model
 *
 * Stores hashed refresh-token sessions so the server never persists
 * raw bearer material. The model supports database-backed sessions
 * with an in-memory fallback for development.
 */

const crypto = require('crypto');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

let memorySessions = [];
let memoryId = 1;
let useMemory = false;

function shouldFallbackToMemory(error) {
  return [
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_NO_SUCH_COLUMN',
    'ER_PARSE_ERROR',
  ].includes(error?.code);
}

function enableMemoryFallback(reason) {
  if (!useMemory) {
    useMemory = true;
    logger.warn('Refresh token model: falling back to in-memory store', { reason });
  }
}

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('Refresh token model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

function normalizeExpiry(expiresAt) {
  return expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
}

function isExpired(expiresAt) {
  return new Date(expiresAt) <= new Date();
}

function toSafeSession(record) {
  if (!record) return null;
  return {
    id: record.id,
    user_id: record.user_id,
    session_id: record.session_id,
    token_hash: record.token_hash,
    expires_at: record.expires_at,
    trust_level: record.trust_level,
    device_fingerprint: record.device_fingerprint,
    ip_address: record.ip_address,
    user_agent: record.user_agent,
    revoked: record.revoked,
    last_seen_at: record.last_seen_at,
    created_at: record.created_at,
  };
}

async function create({
  userId,
  sessionId,
  tokenHash,
  expiresAt,
  trustLevel = 'LOW',
  deviceFingerprint = null,
  ipAddress = null,
  userAgent = null,
}) {
  const normalizedExpiresAt = normalizeExpiry(expiresAt);

  if (useMemory) {
    const record = {
      id: memoryId++,
      user_id: userId,
      session_id: sessionId,
      token_hash: tokenHash,
      expires_at: normalizedExpiresAt,
      trust_level: trustLevel,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      revoked: 0,
      last_seen_at: new Date(),
      created_at: new Date(),
    };
    memorySessions.push(record);
    return toSafeSession(record);
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO refresh_tokens
        (user_id, session_id, token_hash, expires_at, trust_level, device_fingerprint, ip_address, user_agent, revoked, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [userId, sessionId, tokenHash, normalizedExpiresAt, trustLevel, deviceFingerprint, ipAddress, userAgent]
    );

    return {
      id: result.insertId,
      user_id: userId,
      session_id: sessionId,
      token_hash: tokenHash,
      expires_at: normalizedExpiresAt,
      trust_level: trustLevel,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      revoked: 0,
      last_seen_at: new Date(),
    };
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return create({
      userId,
      sessionId,
      tokenHash,
      expiresAt: normalizedExpiresAt,
      trustLevel,
      deviceFingerprint,
      ipAddress,
      userAgent,
    });
  }
}

async function findActiveByTokenHash(tokenHash) {
  if (useMemory) {
    const session = memorySessions.find(
      (item) => item.token_hash === tokenHash && !item.revoked && !isExpired(item.expires_at)
    );
    return toSafeSession(session);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, token_hash, expires_at, trust_level, device_fingerprint,
              ip_address, user_agent, revoked, last_seen_at, created_at
       FROM refresh_tokens
       WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return findActiveByTokenHash(tokenHash);
  }
}

async function findActiveBySessionId(sessionId) {
  if (useMemory) {
    const session = memorySessions.find(
      (item) => item.session_id === sessionId && !item.revoked && !isExpired(item.expires_at)
    );
    return toSafeSession(session);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, token_hash, expires_at, trust_level, device_fingerprint,
              ip_address, user_agent, revoked, last_seen_at, created_at
       FROM refresh_tokens
       WHERE session_id = ? AND revoked = 0 AND expires_at > NOW()
       LIMIT 1`,
      [sessionId]
    );
    return rows[0] || null;
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return findActiveBySessionId(sessionId);
  }
}

async function rotateToken(id, { tokenHash, expiresAt }) {
  const normalizedExpiresAt = normalizeExpiry(expiresAt);

  if (useMemory) {
    const session = memorySessions.find((item) => item.id === id);
    if (!session) return null;
    session.token_hash = tokenHash;
    session.expires_at = normalizedExpiresAt;
    session.revoked = 0;
    session.last_seen_at = new Date();
    return toSafeSession(session);
  }

  try {
    await pool.execute(
      'UPDATE refresh_tokens SET token_hash = ?, expires_at = ?, revoked = 0, last_seen_at = NOW() WHERE id = ?',
      [tokenHash, normalizedExpiresAt, id]
    );
    return findById(id);
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return rotateToken(id, { tokenHash, expiresAt: normalizedExpiresAt });
  }
}

async function updateLastSeen(id) {
  if (useMemory) {
    const session = memorySessions.find((item) => item.id === id);
    if (session) session.last_seen_at = new Date();
    return;
  }

  await pool.execute('UPDATE refresh_tokens SET last_seen_at = NOW() WHERE id = ?', [id]);
}

async function revokeBySessionId(sessionId) {
  if (useMemory) {
    memorySessions.forEach((session) => {
      if (session.session_id === sessionId) session.revoked = 1;
    });
    return;
  }

  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE session_id = ?', [sessionId]);
}

async function revokeByTokenHash(tokenHash) {
  if (useMemory) {
    memorySessions.forEach((session) => {
      if (session.token_hash === tokenHash) session.revoked = 1;
    });
    return;
  }

  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
}

async function revokeUserSessions(userId) {
  if (useMemory) {
    memorySessions.forEach((session) => {
      if (session.user_id === userId) session.revoked = 1;
    });
    return;
  }

  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [userId]);
}

async function findById(id) {
  if (useMemory) {
    const session = memorySessions.find((item) => item.id === id);
    return toSafeSession(session);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, token_hash, expires_at, trust_level, device_fingerprint,
              ip_address, user_agent, revoked, last_seen_at, created_at
       FROM refresh_tokens
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return findById(id);
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  create,
  findActiveByTokenHash,
  findActiveBySessionId,
  rotateToken,
  updateLastSeen,
  revokeBySessionId,
  revokeByTokenHash,
  revokeUserSessions,
  hashToken,
};
