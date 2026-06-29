/**
 * Authentication Middleware
 *
 * Verifies JWT access tokens on protected routes.
 * Tokens are expected in the Authorization header as "Bearer <token>".
 *
 * Security decisions:
 * - Tokens are validated on every request (stateless auth)
 * - Expired/malformed tokens are rejected immediately
 * - User ID is extracted from the token and attached to req.user
 */

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Protect routes that require authentication.
 * Extracts and verifies the JWT from the Authorization header.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return errorResponse(res, 'Log in to continue.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information to the request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'customer',
      sessionId: decoded.sessionId || null,
      trustLevel: decoded.trustLevel || 'LOW',
      deviceFingerprint: decoded.deviceFingerprint || null,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.debug('JWT expired for request');
      return errorResponse(res, 'Your session expired. Please refresh and continue.', 401);
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT received');
      return errorResponse(res, 'That session token is not valid.', 403);
    }

    logger.error('JWT verification error:', { message: error.message });
    return errorResponse(res, 'We could not verify your session.', 403);
  }
}

/**
 * Role-based authorization middleware.
 * Use after authenticateToken to restrict access by role.
 *
 * Example: authorizeRole('admin') — only admins can access.
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'This area needs a different access level.', 403);
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRole,
};
