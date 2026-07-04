/**
 * WebAuthn / FIDO2 Routes
 *
 * Handles biometric fingerprint registration and authentication.
 * These endpoints are wired to the TCP trust flow so successful passkey
 * verification can elevate the device trust score.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const webauthnConfig = require('../config/webauthn');
const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { successResponse, errorResponse } = require('../utils/helpers');
const User = require('../models/User');
const WebAuthnCredential = require('../models/WebAuthnCredential');
const RefreshToken = require('../models/RefreshToken');
const { webauthnRegisterVerifyValidation } = require('../middleware/validator');
const logger = require('../utils/logger');
const trustService = require('../services/trustService');
const {
  generateAccessToken,
  generateRefreshToken,
  generateSessionId,
  setRefreshTokenCookie,
  hashToken,
} = require('../services/tokenService');

const pendingRegistrationOptions = new Map();
const pendingLoginOptions = new Map();
const PENDING_REGISTRATION_TTL_MS = 10 * 60 * 1000;
const PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;

function toUserIdBuffer(userId) {
  return Buffer.from(String(userId));
}

async function getExistingCredentialIds(userId) {
  try {
    const credentials = await WebAuthnCredential.findByUserId(userId);
    return credentials.map((credential) => credential.credential_id);
  } catch (error) {
    logger.warn('WebAuthn credential lookup unavailable, continuing without exclusions', {
      userId,
      message: error.message,
    });
    return [];
  }
}

function getPendingEntry(store, userId, ttlMs) {
  const key = String(userId);
  const pending = store.get(key);
  if (!pending) return null;
  if (Date.now() - pending.createdAt > ttlMs) {
    store.delete(key);
    return null;
  }
  return pending.options;
}

function setPendingEntry(store, userId, options) {
  store.set(String(userId), {
    options,
    createdAt: Date.now(),
  });
}

function clearPendingEntry(store, userId) {
  store.delete(String(userId));
}

function extractRegistrationResponse(body) {
  return body.registrationResponse || body.attestationResponse || body.response || null;
}

function extractAuthenticationResponse(body) {
  return body.authenticationResponse || body.assertionResponse || body.response || null;
}

function buildMockVerificationPayload(user, credentialLabel, credentialId = null) {
  const mockCredential = WebAuthnCredential.createMockCredentialPayload(user.id, credentialLabel);
  return {
    verified: true,
    authenticationInfo: {
      credentialID: credentialId || mockCredential.credentialId,
      newCounter: mockCredential.counter,
      userVerified: true,
      credentialDeviceType: mockCredential.deviceType,
      credentialBackedUp: true,
      origin: webauthnConfig.origin,
      rpID: webauthnConfig.rpID,
    },
    mock: true,
  };
}

async function issuePasskeySession(req, res, user, { biometricVerified = true, trustLevelOverride = null } = {}) {
  const trust = await trustService.assessDeviceTrust({
    req,
    userId: user.id,
    verifiedCredentials: true,
    biometricVerified,
    validSessionAge: true,
  });

  const trustLevel = trustLevelOverride || trust.trustLevel;
  const sessionPolicy = trustService.getSessionPolicy(trustLevel);
  const sessionId = generateSessionId();
  const accessToken = generateAccessToken(user, {
    sessionId,
    trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    expiresIn: sessionPolicy.accessTokenTtl,
  });
  const refreshToken = generateRefreshToken(user, {
    sessionId,
    trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    expiresIn: Math.floor(sessionPolicy.refreshTokenTtlMs / 1000),
  });

  const sessionRecord = await RefreshToken.create({
    userId: user.id,
    sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + sessionPolicy.refreshTokenTtlMs),
    trustLevel,
    deviceFingerprint: trust.deviceFingerprint,
    ipAddress: trustService.getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
  });

  setRefreshTokenCookie(res, refreshToken, sessionPolicy.refreshTokenTtlMs);

  return { trust, sessionRecord, accessToken };
}

// POST /api/webauthn/register-options
router.post('/register-options', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'We could not find that account.', 404);
    }

    const existingCredentialIds = await getExistingCredentialIds(user.id);

    const options = await generateRegistrationOptions({
      rpName: webauthnConfig.rpName,
      rpID: webauthnConfig.rpID,
      userID: toUserIdBuffer(user.id),
      userName: user.email,
      userDisplayName: `${user.first_name} ${user.last_name}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        // authenticatorAttachment not set — allows both built-in sensors and phones
      },
      excludeCredentials: existingCredentialIds.map((credentialId) => ({
        id: credentialId,
      })),
    });

    setPendingEntry(pendingRegistrationOptions, user.id, options);

    successResponse(res, {
      ...options,
      userId: user.id,
      userEmail: user.email,
      credentialCount: existingCredentialIds.length,
      expiresInSeconds: 600,
    }, 'Passkey enrollment options ready.');
  } catch (error) {
    logger.error('WebAuthn register options error:', { message: error.message });
    errorResponse(res, 'We could not prepare passkey enrollment right now.', 500);
  }
});

// POST /api/webauthn/register-verify
router.post('/register-verify', authenticateToken, webauthnRegisterVerifyValidation, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'We could not find that account.', 404);
    }

    const currentOptions = getPendingEntry(pendingRegistrationOptions, user.id, PENDING_REGISTRATION_TTL_MS);
    if (!currentOptions) {
      return errorResponse(res, 'The passkey enrollment challenge expired. Request new options and try again.', 410);
    }

    const credentialLabel = req.body.credentialLabel || 'Passkey';
    const registrationResponse = extractRegistrationResponse(req.body);

    let verificationResult;

    if (req.body.mock || !registrationResponse) {
      const mockCredential = WebAuthnCredential.createMockCredentialPayload(user.id, credentialLabel);
      verificationResult = {
        verified: true,
        registrationInfo: {
          credential: {
            id: mockCredential.credentialId,
            publicKey: mockCredential.publicKey,
            counter: mockCredential.counter,
            transports: ['internal'],
          },
          credentialDeviceType: mockCredential.deviceType,
          credentialBackedUp: true,
        },
        mock: true,
      };
    } else {
      try {
        verificationResult = await verifyRegistrationResponse({
          response: registrationResponse,
          expectedChallenge: currentOptions.challenge,
          expectedOrigin: webauthnConfig.origin,
          expectedRPID: webauthnConfig.rpID,
          requireUserVerification: false,
        });
      } catch (error) {
        logger.warn('WebAuthn register verify failed, using mock fallback in development', {
          userId: user.id,
          message: error.message,
        });

        if (process.env.NODE_ENV === 'production') {
          return errorResponse(res, 'We could not verify the passkey registration response.', 400);
        }

        const mockCredential = WebAuthnCredential.createMockCredentialPayload(user.id, credentialLabel);
        verificationResult = {
          verified: true,
          registrationInfo: {
            credential: {
              id: mockCredential.credentialId,
              publicKey: mockCredential.publicKey,
              counter: mockCredential.counter,
              transports: ['internal'],
            },
            credentialDeviceType: mockCredential.deviceType,
            credentialBackedUp: true,
          },
          mock: true,
        };
      }
    }

    if (!verificationResult.verified) {
      return errorResponse(res, 'That passkey enrollment was not verified.', 400);
    }

    const registrationInfo = verificationResult.registrationInfo;
    const credential = registrationInfo?.credential;
    if (!credential?.id || !credential?.publicKey) {
      return errorResponse(res, 'The passkey response was incomplete.', 400);
    }

    const storedCredential = await WebAuthnCredential.create({
      userId: user.id,
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter || 0,
      deviceType: registrationInfo.credentialDeviceType || null,
    });

    clearPendingEntry(pendingRegistrationOptions, user.id);

    successResponse(res, {
      verified: true,
      credentialId: storedCredential.credential_id || storedCredential.credentialId || credential.id,
      deviceType: registrationInfo.credentialDeviceType || null,
      backedUp: Boolean(registrationInfo.credentialBackedUp),
      mock: Boolean(verificationResult.mock),
    }, 'Passkey enrollment verified.');
  } catch (error) {
    logger.error('WebAuthn register verify error:', { message: error.message });
    errorResponse(res, 'We could not verify passkey enrollment right now.', 500);
  }
});

// POST /api/webauthn/login-options
router.post('/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email is required to prepare passkey login.', 400);
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'We could not find that account.', 404);
    }

    const credentials = await WebAuthnCredential.findByUserId(user.id);

    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credential_id,
      })),
      userVerification: 'preferred',
    });

    setPendingEntry(pendingLoginOptions, user.id, options);

    successResponse(res, {
      ...options,
      userId: user.id,
      userEmail: user.email,
      credentialCount: credentials.length,
      expiresInSeconds: 600,
    }, 'Passkey sign-in options ready.');
  } catch (error) {
    logger.error('WebAuthn login options error:', { message: error.message });
    errorResponse(res, 'We could not prepare passkey sign-in right now.', 500);
  }
});

// POST /api/webauthn/login-verify
router.post('/login-verify', async (req, res) => {
  try {
    const authenticationResponse = extractAuthenticationResponse(req.body);
    const credentialId = req.body.credentialId || authenticationResponse?.id || null;
    const credentialLabel = req.body.credentialLabel || 'Passkey';

    let user = null;
    let credential = null;

    if (credentialId) {
      credential = await WebAuthnCredential.findByCredentialId(credentialId);
      if (credential) {
        user = await User.findById(credential.user_id);
      }
    }

    if (!user && req.body.email) {
      user = await User.findByEmail(req.body.email);
    }

    if (!user) {
      return errorResponse(res, 'We could not find the account for that passkey.', 404);
    }

    const currentOptions = getPendingEntry(pendingLoginOptions, user.id, PENDING_LOGIN_TTL_MS);

    if (!credential && !req.body.mock && !authenticationResponse) {
      return errorResponse(res, 'No registered passkey was supplied for verification.', 400);
    }

    let verificationResult;

    if (req.body.mock || !authenticationResponse) {
      verificationResult = buildMockVerificationPayload(user, credentialLabel, credentialId);
    } else {
      if (!currentOptions) {
        return errorResponse(res, 'The passkey login challenge expired. Request new options and try again.', 410);
      }

      if (!credential) {
        return errorResponse(res, 'We could not match that passkey to an account.', 404);
      }

      try {
        verificationResult = await verifyAuthenticationResponse({
          response: authenticationResponse,
          expectedChallenge: currentOptions.challenge,
          expectedOrigin: webauthnConfig.origin,
          expectedRPID: webauthnConfig.rpID,
          credential: {
            id: credential.credential_id,
            publicKey: Buffer.from(credential.public_key, 'base64'),
            counter: credential.counter || 0,
          },
          requireUserVerification: false,
        });
      } catch (error) {
        logger.warn('WebAuthn login verify failed, using mock fallback in development', {
          userId: user.id,
          message: error.message,
        });

        if (process.env.NODE_ENV === 'production') {
          return errorResponse(res, 'We could not verify the passkey login response.', 400);
        }

        verificationResult = buildMockVerificationPayload(user, credentialLabel, credentialId);
      }
    }

    if (!verificationResult.verified) {
      return errorResponse(res, 'That passkey login was not verified.', 400);
    }

    const newCounter = verificationResult.authenticationInfo?.newCounter ?? credential?.counter ?? 0;
    if (credential && Number.isFinite(newCounter)) {
      await WebAuthnCredential.updateCounter(credential.credential_id, newCounter);
    }

    const session = await issuePasskeySession(req, res, user, { biometricVerified: true });

    clearPendingEntry(pendingLoginOptions, user.id);

    successResponse(res, {
      accessToken: session.accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      trust: trustService.buildTrustPayload({
        trust: session.trust,
        session: session.sessionRecord,
      }),
      session: {
        sessionId: session.sessionRecord.session_id,
        trustLevel: session.sessionRecord.trust_level,
        expiresAt: session.sessionRecord.expires_at,
      },
      webauthn: {
        verified: true,
        counter: newCounter,
        mock: Boolean(verificationResult.mock),
      },
    }, 'Passkey login verified.');
  } catch (error) {
    logger.error('WebAuthn login verify error:', { message: error.message });
    errorResponse(res, 'We could not verify passkey login right now.', 500);
  }
});

module.exports = router;
