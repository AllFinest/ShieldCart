/**
 * User Model
 *
 * Handles all database operations for the users table.
 * Uses parameterized queries exclusively to prevent SQL injection.
 * Falls back to in-memory store when MySQL is unavailable (development).
 */

const { pool } = require('../config/db');
const logger = require('../utils/logger');

let memoryStore = [];
let memoryId = 1;
let useMemory = false;

async function initMemoryCheck() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    useMemory = false;
  } catch {
    useMemory = true;
    logger.info('User model: using in-memory store (MySQL unavailable)');
  }
}

initMemoryCheck();

async function findByEmail(email) {
  if (useMemory) {
    return memoryStore.find((u) => u.email === email) || null;
  }
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  if (useMemory) {
    return memoryStore.find((u) => u.id === id) || null;
  }
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ email, passwordHash, firstName, lastName, role = 'customer' }) {
  if (useMemory) {
    const user = {
      id: memoryId++,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: 1,
      email_verified: 0,
      login_attempts: 0,
      locked_until: null,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.push(user);
    return user;
  }
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, ?)`,
    [email, passwordHash, firstName, lastName, role]
  );
  return findById(result.insertId);
}

async function updateLastLogin(id) {
  if (useMemory) {
    const user = memoryStore.find((u) => u.id === id);
    if (user) {
      user.last_login = new Date();
      user.login_attempts = 0;
      user.locked_until = null;
    }
    return;
  }
  await pool.execute(
    'UPDATE users SET last_login = NOW(), login_attempts = 0, locked_until = NULL WHERE id = ?',
    [id]
  );
}

async function incrementLoginAttempts(id) {
  if (useMemory) {
    const user = memoryStore.find((u) => u.id === id);
    if (user) {
      user.login_attempts += 1;
      if (user.login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      }
    }
    return;
  }
  await pool.execute(
    `UPDATE users SET login_attempts = login_attempts + 1,
     locked_until = CASE WHEN login_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE) ELSE locked_until END
     WHERE id = ?`,
    [id]
  );
}

async function findAll({ page = 1, limit = 20 } = {}) {
  if (useMemory) {
    const start = (page - 1) * limit;
    const users = memoryStore.slice(start, start + limit).map((u) => {
      // eslint-disable-next-line no-unused-vars
      const { password_hash: _omit, ...safe } = u;
      return safe;
    });
    return { users, total: memoryStore.length };
  }
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    'SELECT id, email, first_name, last_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [String(limit), String(offset)]
  );
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM users');
  return { users: rows, total };
}

async function updateStatus(id, isActive) {
  if (useMemory) {
    const user = memoryStore.find((u) => u.id === id);
    if (user) user.is_active = isActive ? 1 : 0;
    return;
  }
  await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  incrementLoginAttempts,
  findAll,
  updateStatus,
};
