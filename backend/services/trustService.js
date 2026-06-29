/**
 * Trust Service
 *
 * Implements Trusted Computing Platform concepts:
 * - Device fingerprinting for known-device recognition
 * - Trust scoring for login/session risk
 * - Secure-session policy selection
 * - Device trust persistence and session summaries
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const DeviceTrust = require('../models/DeviceTrust');

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isSecureChannel(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  return Boolean(req.secure || forwardedProto === 'https');
}

/**
 * Generate a device fingerprint from request metadata.
 * The hash is deterministic for the same browser/device profile.
 */
function generateDeviceFingerprint(req) {
  const components = [
    req.headers['user-agent'] || 'unknown',
    req.headers['accept-language'] || 'unknown',
    req.headers['sec-ch-ua-platform'] || 'unknown',
    req.headers['sec-ch-ua-mobile'] || 'unknown',
    getClientIp(req),
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

/**
 * Calculate a trust score based on login/session attributes.
 * The score is intentionally simple and explainable for coursework.
 */
function calculateTrustScore(factors) {
  let score = 0;

  if (factors.knownDevice) score += 25;
  if (factors.verifiedCredentials) score += 25;
  if (factors.biometricVerified) score += 25;
  if (factors.consistentIP) score += 10;
  if (factors.validSessionAge) score += 10;
  if (factors.secureChannel) score += 15;

  logger.debug(`Trust score calculated: ${score}`, { factors });

  return score;
}

function getTrustLevel(score) {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function getSessionPolicy(trustLevel = 'LOW') {
  if (trustLevel === 'HIGH') {
    return {
      refreshTokenTtlMs: 14 * 24 * 60 * 60 * 1000,
      accessTokenTtl: '15m',
    };
  }

  if (trustLevel === 'MEDIUM') {
    return {
      refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
      accessTokenTtl: '15m',
    };
  }

  return {
    refreshTokenTtlMs: 24 * 60 * 60 * 1000,
    accessTokenTtl: '10m',
  };
}

function getTrustStatusMessage(trustLevel, isNewDevice) {
  if (trustLevel === 'HIGH') {
    return isNewDevice ? 'This device is now recognized as trusted.' : 'Trusted device confirmed.';
  }

  if (trustLevel === 'MEDIUM') {
    return isNewDevice
      ? 'This is a fresh device. We opened the session with extra safeguards.'
      : 'This device is familiar, but we kept the session under watch.';
  }

  return 'This sign-in needs closer attention and shorter session life.';
}

async function assessDeviceTrust({
  req,
  userId,
  biometricVerified = false,
  verifiedCredentials = false,
  validSessionAge = false,
}) {
  const deviceFingerprint = generateDeviceFingerprint(req);
  const currentIp = getClientIp(req);
  const secureChannel = isSecureChannel(req);

  const knownDevice = await DeviceTrust.findByFingerprint(userId, deviceFingerprint);
  const consistentIP = Boolean(knownDevice?.ip_address && knownDevice.ip_address === currentIp);

  const trustScore = calculateTrustScore({
    knownDevice: Boolean(knownDevice),
    verifiedCredentials,
    biometricVerified,
    consistentIP,
    validSessionAge,
    secureChannel,
  });

  const trustLevel = getTrustLevel(trustScore);
  const isTrusted = trustLevel === 'HIGH';
  const deviceRecord = await DeviceTrust.upsert({
    userId,
    deviceFingerprint,
    trustScore,
    userAgent: req.headers['user-agent'] || null,
    ipAddress: currentIp,
    isTrusted,
  });

  return {
    deviceFingerprint,
    trustScore,
    trustLevel,
    isTrusted,
    secureChannel,
    knownDevice: Boolean(knownDevice),
    consistentIP,
    deviceRecord,
    statusMessage: getTrustStatusMessage(trustLevel, !knownDevice),
  };
}

function buildSessionSummary({ session, trust }) {
  if (!session) return null;

  return {
    sessionId: session.session_id || session.sessionId || null,
    trustLevel: session.trust_level || session.trustLevel || trust?.trustLevel || 'LOW',
    trustScore: trust?.trustScore ?? null,
    deviceFingerprint: session.device_fingerprint || session.deviceFingerprint || trust?.deviceFingerprint || null,
    lastSeenAt: session.last_seen_at || session.lastSeenAt || null,
    expiresAt: session.expires_at || session.expiresAt || null,
    revoked: Boolean(session.revoked),
  };
}

function buildTrustPayload({ trust, session = null }) {
  return {
    deviceFingerprint: trust.deviceFingerprint,
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    isTrusted: trust.isTrusted,
    secureChannel: trust.secureChannel,
    knownDevice: trust.knownDevice,
    consistentIP: trust.consistentIP,
    statusMessage: trust.statusMessage,
    session: buildSessionSummary({ session, trust }),
  };
}

module.exports = {
  getClientIp,
  isSecureChannel,
  generateDeviceFingerprint,
  calculateTrustScore,
  getTrustLevel,
  getSessionPolicy,
  assessDeviceTrust,
  buildTrustPayload,
  buildSessionSummary,
};
