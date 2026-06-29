/**
 * Rate Limiting Middleware
 *
 * Protects against brute-force attacks and API abuse.
 * Different limits for different endpoint categories:
 * - Auth endpoints: strict (prevent credential stuffing)
 * - General API: moderate
 * - Payment endpoints: strict (prevent abuse)
 */

const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/helpers');

/**
 * General API rate limiter.
 * Allows 100 requests per 15-minute window per IP.
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    errorResponse(res, 'Too many requests came through. Try again shortly.', 429);
  },
});

/**
 * Authentication rate limiter.
 * Strict: 10 attempts per 15-minute window per IP.
 * Mitigates brute-force password attacks and credential stuffing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    errorResponse(
      res,
      'Too many login attempts. Please wait 15 minutes before trying again.',
      429
    );
  },
});

/**
 * Payment rate limiter.
 * Strict: 5 payment attempts per 15-minute window per IP.
 * Prevents payment fraud and API abuse.
 */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    errorResponse(res, 'Payment attempts are moving too quickly. Please try again later.', 429);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
};
