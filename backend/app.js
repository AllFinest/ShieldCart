/**
 * Express Application Configuration
 *
 * This file configures the Express app with all middleware and routes.
 * Separation from server.js allows the app to be imported for testing
 * without starting the HTTP server.
 *
 * Middleware execution order matters for security:
 * 1. Helmet (secure headers) — must run first
 * 2. CORS — controls allowed origins
 * 3. Rate limiting — prevents abuse before any processing
 * 4. Body parsing — parse request bodies
 * 5. Cookie parsing — needed for CSRF tokens
 * 6. CSRF protection — validates anti-forgery tokens
 * 7. Routes — actual business logic
 * 8. Error handler — catches unhandled errors
 */

const express = require('express');
const { helmetMiddleware, corsMiddleware, cookieParser, secureTransportMiddleware } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');
const { doubleCsrfProtection, csrfTokenEndpoint } = require('./middleware/csrf');
const { errorResponse } = require('./utils/helpers');
const logger = require('./utils/logger');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webauthnRoutes = require('./routes/webauthnRoutes');

const app = express();

// Allow secure-transport checks to honor proxy TLS termination
app.set('trust proxy', 1);

// --- Security Middleware (runs on every request) ---
app.use(helmetMiddleware());
app.use(corsMiddleware());
app.use(generalLimiter);
app.use(secureTransportMiddleware());

// --- Body Parsing ---
// JSON body limit prevents large payload DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// --- Cookie Parsing (required for CSRF) ---
app.use(cookieParser());

// --- CSRF Token Endpoint (must be BEFORE CSRF protection middleware) ---
app.get('/api/csrf-token', csrfTokenEndpoint);

// --- CSRF Protection (applied to state-changing requests) ---
// Skip CSRF for Stripe webhooks (they use their own signature verification)
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});

// --- Health Check (unauthenticated, for monitoring) ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webauthn', webauthnRoutes);

// --- 404 Handler ---
app.use((_req, res) => {
  errorResponse(res, 'That resource is not available.', 404);
});

// --- Global Error Handler ---
// Express requires exactly 4 parameters to recognize this as an error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });

  // CSRF token mismatch
  if (err.code === 'EBADCSRFTOKEN') {
    return errorResponse(res, 'Security check missing or expired. Refresh and try again.', 403);
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'The request body is not valid JSON.', 400);
  }

  // Never expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : err.message;

  errorResponse(res, message, err.status || 500);
});

module.exports = app;
