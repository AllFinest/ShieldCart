/**
 * Authentication Routes
 *
 * Handles user registration, login, logout, token refresh, and password reset.
 * The login flow now records trusted-device metadata and hashes refresh tokens
 * before persisting them so session material is never stored in plaintext.
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, passwordResetValidation } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../services/authService');
const {
  generateAccessToken,
  generateRefreshToken,
  generateSessionId,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  hashToken,
} = require('../services/tokenService');
const trustService = require('../services/trustService');
const RefreshToken = require('../models/RefreshToken');
const DeviceTrust = require('../models/DeviceTrust');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}

function buildTrustDescriptor({ trust, session = null }) {
  return trustService.buildTrustPayload({ trust, session });
}

async function issueTrustedSession(req, res, user, { biometricVerified = false } = {}) {
  const trust = await trustService.assessDeviceTrust({
    req,
    userId: user.id,
    verifiedCredentials: true,
    biometricVerified,
    validSessionAge: false,
  });

  const sessionId = generateSessionId();
  const sessionPolicy = trustService.getSessionPolicy(trust.trustLevel);
  const accessToken = generateAccessToken(user, {
    sessionId,
    trustLevel: trust.trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    expiresIn: sessionPolicy.accessTokenTtl,
  });
  const refreshToken = generateRefreshToken(user, {
    sessionId,
    trustLevel: trust.trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    expiresIn: Math.floor(sessionPolicy.refreshTokenTtlMs / 1000),
  });

  const sessionRecord = await RefreshToken.create({
    userId: user.id,
    sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + sessionPolicy.refreshTokenTtlMs),
    trustLevel: trust.trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    ipAddress: trustService.getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
  });

  setRefreshTokenCookie(res, refreshToken, sessionPolicy.refreshTokenTtlMs);

  return {
    accessToken,
    refreshToken,
    trust,
    session: sessionRecord,
    sessionPolicy,
  };
}

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    logger.info('Registration attempt', { email, firstName, lastName });

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'That email is already connected to an account.', 409);
    }

    logger.info('User not found, creating new user', { email });
    const passwordHash = await hashPassword(password);
    logger.info('Password hashed successfully');
    
    const user = await User.create({ email, passwordHash, firstName, lastName });
    logger.info('User created successfully', { userId: user.id, email: user.email });

    logger.info('Issuing trusted session');
    const session = await issueTrustedSession(req, res, user, { biometricVerified: false });
    logger.info('Session issued successfully');

    logger.info('User registered', { userId: user.id, email: user.email });

    successResponse(res, {
      accessToken: session.accessToken,
      user: serializeUser(user),
      trust: buildTrustDescriptor({ trust: session.trust, session: session.session }),
      session: {
        sessionId: session.session.session_id,
        trustLevel: session.session.trust_level,
        expiresAt: session.session.expires_at,
      },
    }, 'Your new account is ready.', 201);
  } catch (error) {
    logger.error('Registration error:', { 
      message: error.message, 
      stack: error.stack,
      body: req.body 
    });
    errorResponse(res, 'We could not create the account. Please try once more.', 500);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'Those login details did not match our records.', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'This account is paused. Please contact support.', 403);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return errorResponse(res, `Too many attempts. Try again in ${minutesLeft} minutes.`, 423);
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      await User.incrementLoginAttempts(user.id);
      return errorResponse(res, 'Those login details did not match our records.', 401);
    }

    await User.updateLastLogin(user.id);

    const session = await issueTrustedSession(req, res, user, { biometricVerified: false });

    logger.info('User logged in', { userId: user.id, email: user.email });

    successResponse(res, {
      accessToken: session.accessToken,
      user: serializeUser(user),
      trust: buildTrustDescriptor({ trust: session.trust, session: session.session }),
      session: {
        sessionId: session.session.session_id,
        trustLevel: session.session.trust_level,
        expiresAt: session.session.expires_at,
      },
    }, 'You are logged in.');
  } catch (error) {
    logger.error('Login error:', { message: error.message });
    errorResponse(res, 'We could not log you in. Give it another try.', 500);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user?.sessionId) {
      await RefreshToken.revokeBySessionId(req.user.sessionId);
    } else {
      await RefreshToken.revokeUserSessions(req.user.id);
    }
  } catch (error) {
    logger.warn('Session revocation during logout failed', { message: error.message });
  } finally {
    clearRefreshTokenCookie(res);
  }

  successResponse(res, null, 'You are logged out.');
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return errorResponse(res, 'Your session refresh is missing.', 401);
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    clearRefreshTokenCookie(res);
    return errorResponse(res, 'Your session refresh is no longer valid.', 401);
  }

  try {
    const tokenHash = hashToken(token);
    const sessionRecord = await RefreshToken.findActiveByTokenHash(tokenHash);
    if (!sessionRecord || sessionRecord.user_id !== decoded.userId) {
      clearRefreshTokenCookie(res);
      return errorResponse(res, 'Your session refresh is no longer valid.', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      await RefreshToken.revokeByTokenHash(tokenHash);
      clearRefreshTokenCookie(res);
      return errorResponse(res, 'We could not reopen this account session.', 401);
    }

    const trust = await trustService.assessDeviceTrust({
      req,
      userId: user.id,
      verifiedCredentials: true,
      biometricVerified: false,
      validSessionAge: true,
    });

    const sessionPolicy = trustService.getSessionPolicy(trust.trustLevel);
    const accessToken = generateAccessToken(user, {
      sessionId: sessionRecord.session_id,
      trustLevel: trust.trustLevel,
      deviceFingerprint: trust.deviceFingerprint,
      expiresIn: sessionPolicy.accessTokenTtl,
    });
    const newRefreshToken = generateRefreshToken(user, {
      sessionId: sessionRecord.session_id,
      trustLevel: trust.trustLevel,
      deviceFingerprint: trust.deviceFingerprint,
      expiresIn: Math.floor(sessionPolicy.refreshTokenTtlMs / 1000),
    });
    const newTokenHash = hashToken(newRefreshToken);

    await RefreshToken.rotateToken(sessionRecord.id, {
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + sessionPolicy.refreshTokenTtlMs),
    });

    setRefreshTokenCookie(res, newRefreshToken, sessionPolicy.refreshTokenTtlMs);

    const updatedSession = await RefreshToken.findActiveBySessionId(sessionRecord.session_id);
    if (!updatedSession) {
      clearRefreshTokenCookie(res);
      return errorResponse(res, 'We could not refresh the session.', 500);
    }

    successResponse(res, {
      accessToken,
      trust: buildTrustDescriptor({ trust, session: updatedSession }),
      session: {
        sessionId: updatedSession.session_id,
        trustLevel: updatedSession.trust_level,
        expiresAt: updatedSession.expires_at,
      },
    }, 'Session refreshed.');
  } catch (error) {
    logger.error('Token refresh error:', { message: error.message });
    clearRefreshTokenCookie(res);
    errorResponse(res, 'We could not refresh the session.', 500);
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'We could not find that profile.', 404);
    }

    let trust = null;
    if (req.user.sessionId) {
      const [sessionRecord, deviceTrust] = await Promise.all([
        RefreshToken.findActiveBySessionId(req.user.sessionId),
        req.user.deviceFingerprint
          ? DeviceTrust.findByFingerprint(req.user.id, req.user.deviceFingerprint)
          : Promise.resolve(null),
      ]);

      if (sessionRecord) {
        trust = buildTrustDescriptor({
          trust: {
            deviceFingerprint: sessionRecord.device_fingerprint || req.user.deviceFingerprint,
            trustScore: Number(deviceTrust?.trust_score || 0),
            trustLevel: sessionRecord.trust_level || trustService.getTrustLevel(Number(deviceTrust?.trust_score || 0)),
            isTrusted: Boolean(deviceTrust?.is_trusted),
            secureChannel: trustService.isSecureChannel(req),
            knownDevice: Boolean(deviceTrust),
            consistentIP: Boolean(deviceTrust?.ip_address && deviceTrust.ip_address === trustService.getClientIp(req)),
            statusMessage: 'Session loaded successfully.',
          },
          session: sessionRecord,
        });
      }
    }

    successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      trust,
    }, 'Profile loaded.');
  } catch (error) {
    logger.error('Profile fetch error:', { message: error.message });
    errorResponse(res, 'We could not load the profile.', 500);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, passwordResetValidation, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      if (process.env.NODE_ENV !== 'production') {
        const resetBase = process.env.APP_URL || 'http://localhost:5173';
        logger.info('Password reset token issued', {
          userId: user.id,
          email: user.email,
          resetUrl: `${resetBase}/reset-password?token=${resetToken}`,
        });
      } else {
        logger.info('Password reset requested', { userId: user.id, email: user.email });
      }
    }

    successResponse(res, null, 'If that email is registered, reset instructions are on the way.');
  } catch (error) {
    logger.error('Forgot password error:', { message: error.message });
    errorResponse(res, 'We could not process the password reset request.', 500);
  }
});

module.exports = router;
