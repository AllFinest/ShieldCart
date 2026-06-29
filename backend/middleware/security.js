/**
 * Security Middleware Configuration
 *
 * Aggregates all security-related Express middleware:
 * - Helmet: sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
 * - CORS: restricts cross-origin requests to the frontend origin only
 * - Cookie parser: required for CSRF double-submit cookies
 *
 * These middleware run on EVERY request, forming the first line of defense.
 */

const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorResponse } = require('../utils/helpers');

/**
 * Configure Helmet with a strict Content Security Policy.
 * CSP prevents XSS by whitelisting script/style/image sources.
 */
function helmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // Enforce HTTPS via Strict-Transport-Security in production
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Hide Express fingerprint
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable XSS filter
    xssFilter: true,
  });
}

/**
 * Configure CORS to only allow requests from the frontend origin.
 * credentials: true allows cookies (needed for CSRF and refresh tokens).
 */
function corsMiddleware() {
  return cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 600, // Cache preflight for 10 minutes
  });
}

/**
 * Enforce secure transport for production traffic.
 * When TLS terminates upstream, trust proxy + x-forwarded-proto allow us
 * to distinguish HTTPS requests from insecure ones.
 */
function secureTransportMiddleware() {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      const forwardedProto = req.headers['x-forwarded-proto'];
      if (!req.secure && forwardedProto !== 'https') {
        return errorResponse(res, 'Secure HTTPS is required for this request.', 400);
      }
    }

    return next();
  };
}

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  cookieParser,
  secureTransportMiddleware,
};
