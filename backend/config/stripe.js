/**
 * Stripe Payment Configuration
 *
 * Initializes the Stripe SDK with the secret key from environment variables.
 * Uses Stripe Sandbox (test mode) keys during development.
 * The secret key must NEVER be exposed to the frontend.
 */

const Stripe = require('stripe');
const logger = require('../utils/logger');

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY is not set — payment features will be unavailable');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

module.exports = stripe;
