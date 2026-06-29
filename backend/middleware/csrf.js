/**
 * CSRF Protection Middleware
 *
 * Implements the double-submit cookie pattern:
 * 1. Server generates a CSRF token and sets it as a cookie
 * 2. Client reads the cookie and sends it in the X-CSRF-Token header
 * 3. Server validates that the header matches the cookie
 *
 * This prevents cross-site request forgery because an attacker's site
 * cannot read cookies from our domain (same-origin policy).
 */

const { doubleCsrf } = require('csrf-csrf');
const logger = require('../utils/logger');

const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'csrf-default-secret-change-me',
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' || process.env.CORS_ORIGIN?.startsWith('https://'),
    path: '/',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

/**
 * Endpoint to issue a CSRF token to the client.
 * The client calls GET /api/csrf-token on page load to obtain a token.
 */
function csrfTokenEndpoint(req, res) {
  const token = generateToken(req, res);
  logger.debug('CSRF token generated');
  res.json({ csrfToken: token });
}

module.exports = {
  doubleCsrfProtection,
  csrfTokenEndpoint,
};
