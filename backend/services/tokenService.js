/**
 * Token Service
 *
 * Centralizes JWT issuance and cookie handling.
 * Refresh tokens are hashed before persistence and stored only as httpOnly cookies.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

function generateSessionId() {
  return crypto.randomUUID();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshCookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAgeMs,
    path: '/api/auth/refresh',
  };
}

function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  };
}

function generateAccessToken(user, sessionContext = {}) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'customer',
      sessionId: sessionContext.sessionId || null,
      trustLevel: sessionContext.trustLevel || 'LOW',
      deviceFingerprint: sessionContext.deviceFingerprint || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: sessionContext.expiresIn || process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user, sessionContext = {}) {
  return jwt.sign(
    {
      userId: user.id,
      sessionId: sessionContext.sessionId || generateSessionId(),
      trustLevel: sessionContext.trustLevel || 'LOW',
      deviceFingerprint: sessionContext.deviceFingerprint || null,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: sessionContext.expiresIn || process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    logger.debug('Refresh token verification failed:', { message: error.message });
    return null;
  }
}

function setRefreshTokenCookie(res, token, maxAgeMs) {
  res.cookie('refreshToken', token, getRefreshCookieOptions(maxAgeMs));
}

function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', getClearCookieOptions());
}

module.exports = {
  generateSessionId,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshCookieOptions,
};
