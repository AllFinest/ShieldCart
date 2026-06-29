/**
 * Authentication Service
 *
 * Business logic for user authentication operations.
 * Separates auth logic from HTTP handling (controllers) for testability.
 *
 * Implements:
 * - Password hashing with bcrypt (12 salt rounds)
 * - Secure password comparison (constant-time)
 * - User lookup by email
 */

const bcrypt = require('bcrypt');

// Salt rounds: 12 provides a good balance of security and performance.
// Each increment doubles the computation time.
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 * bcrypt automatically generates a unique salt per hash.
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Uses constant-time comparison to prevent timing attacks.
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
