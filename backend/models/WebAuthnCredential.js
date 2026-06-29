/**
 * WebAuthn Credential Model
 *
 * Stores passkey credentials for authenticated users with a database-backed
 * implementation and an in-memory fallback for development.
 */

const crypto = require('crypto');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

let memoryCredentials = [];
let memoryId = 1;
let useMemory = false;

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('WebAuthn credential model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

async function findByUserId(userId) {
  if (useMemory) {
    return memoryCredentials.filter((credential) => credential.user_id === userId);
  }

  const [rows] = await pool.execute(
    `SELECT id, user_id, credential_id, public_key, counter, device_type, created_at
     FROM webauthn_credentials
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function findByCredentialId(credentialId) {
  if (useMemory) {
    return memoryCredentials.find((credential) => credential.credential_id === credentialId) || null;
  }

  const [rows] = await pool.execute(
    `SELECT id, user_id, credential_id, public_key, counter, device_type, created_at
     FROM webauthn_credentials
     WHERE credential_id = ?
     LIMIT 1`,
    [credentialId]
  );
  return rows[0] || null;
}

async function create({ userId, credentialId, publicKey, counter = 0, deviceType = null }) {
  if (useMemory) {
    const record = {
      id: memoryId++,
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey,
      counter,
      device_type: deviceType,
      created_at: new Date(),
    };
    memoryCredentials.push(record);
    return record;
  }

  const [result] = await pool.execute(
    `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, device_type)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, credentialId, publicKey, counter, deviceType]
  );

  return {
    id: result.insertId,
    user_id: userId,
    credential_id: credentialId,
    public_key: publicKey,
    counter,
    device_type: deviceType,
  };
}

async function updateCounter(credentialId, counter) {
  if (useMemory) {
    const credential = memoryCredentials.find((entry) => entry.credential_id === credentialId);
    if (credential) {
      credential.counter = counter;
    }
    return credential || null;
  }

  await pool.execute(
    'UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?',
    [counter, credentialId]
  );

  return findByCredentialId(credentialId);
}

function createMockCredentialPayload(userId, label = 'Passkey') {
  return {
    credentialId: `mock-cred-${crypto.randomUUID()}`,
    publicKey: `mock-public-key-${userId}`,
    counter: 0,
    deviceType: 'multiDevice',
    label,
  };
}

module.exports = {
  findByUserId,
  findByCredentialId,
  create,
  updateCounter,
  createMockCredentialPayload,
};
