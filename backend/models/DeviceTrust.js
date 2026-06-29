/**
 * Device Trust Model
 *
 * Persists trusted-device metadata used by TCP scoring.
 * A device fingerprint is tied to a user so we can distinguish
 * familiar sessions from new or suspicious devices.
 */

const { pool } = require('../config/db');
const logger = require('../utils/logger');

let memoryDevices = [];
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
    logger.warn('Device trust model: falling back to in-memory store', { reason });
  }
}

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('Device trust model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

function toSafeDevice(record) {
  if (!record) return null;
  return {
    id: record.id,
    user_id: record.user_id,
    device_fingerprint: record.device_fingerprint,
    trust_score: record.trust_score,
    user_agent: record.user_agent,
    ip_address: record.ip_address,
    is_trusted: record.is_trusted,
    last_seen: record.last_seen,
    created_at: record.created_at,
  };
}

async function findByFingerprint(userId, deviceFingerprint) {
  if (useMemory) {
    const device = memoryDevices.find(
      (entry) => entry.user_id === userId && entry.device_fingerprint === deviceFingerprint
    );
    return toSafeDevice(device);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, device_fingerprint, trust_score, user_agent, ip_address, is_trusted, last_seen, created_at
       FROM device_trust
       WHERE user_id = ? AND device_fingerprint = ?
       LIMIT 1`,
      [userId, deviceFingerprint]
    );
    return rows[0] || null;
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return findByFingerprint(userId, deviceFingerprint);
  }
}

async function upsert({
  userId,
  deviceFingerprint,
  trustScore = 0,
  userAgent = null,
  ipAddress = null,
  isTrusted = false,
}) {
  if (useMemory) {
    const existing = memoryDevices.find(
      (entry) => entry.user_id === userId && entry.device_fingerprint === deviceFingerprint
    );

    if (existing) {
      existing.trust_score = trustScore;
      existing.user_agent = userAgent;
      existing.ip_address = ipAddress;
      existing.is_trusted = isTrusted ? 1 : 0;
      existing.last_seen = new Date();
      return toSafeDevice(existing);
    }

    const record = {
      id: memoryId++,
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      trust_score: trustScore,
      user_agent: userAgent,
      ip_address: ipAddress,
      is_trusted: isTrusted ? 1 : 0,
      last_seen: new Date(),
      created_at: new Date(),
    };
    memoryDevices.push(record);
    return toSafeDevice(record);
  }

  try {
    await pool.execute(
      `INSERT INTO device_trust
        (user_id, device_fingerprint, trust_score, user_agent, ip_address, is_trusted, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         trust_score = VALUES(trust_score),
         user_agent = VALUES(user_agent),
         ip_address = VALUES(ip_address),
         is_trusted = VALUES(is_trusted),
         last_seen = NOW()`,
      [userId, deviceFingerprint, trustScore, userAgent, ipAddress, isTrusted ? 1 : 0]
    );

    return findByFingerprint(userId, deviceFingerprint);
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return upsert({
      userId,
      deviceFingerprint,
      trustScore,
      userAgent,
      ipAddress,
      isTrusted,
    });
  }
}

async function listByUserId(userId) {
  if (useMemory) {
    return memoryDevices.filter((entry) => entry.user_id === userId).map(toSafeDevice);
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, device_fingerprint, trust_score, user_agent, ip_address, is_trusted, last_seen, created_at
       FROM device_trust
       WHERE user_id = ?
       ORDER BY last_seen DESC, created_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    enableMemoryFallback(error.code);
    return listByUserId(userId);
  }
}

module.exports = {
  findByFingerprint,
  upsert,
  listByUserId,
};
