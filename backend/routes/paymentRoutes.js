/**
 * Payment Routes
 *
 * Handles Stripe payment intent creation.
 * The endpoint validates the checkout payload, recalculates totals from the
 * authenticated user's cart, and returns a payment intent client secret.
 *
 * Mock mode (FORCE_MOCK_PAYMENT=true in backend .env):
 *   Returns a fake clientSecret immediately — Stripe is never called.
 *   Use this during development/testing to avoid incomplete intents
 *   cluttering your Stripe sandbox dashboard.
 *
 * Real mode (default when STRIPE_SECRET_KEY is set):
 *   Creates a real Stripe PaymentIntent. The frontend must call
 *   stripe.confirmCardPayment(clientSecret) to complete the charge.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { paymentIntentValidation } = require('../middleware/validator');
const Cart = require('../models/Cart');
const stripe = require('../config/stripe');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

function buildShippingAddress(shipping) {
  return {
    name: shipping.fullName,
    address: {
      line1: shipping.address,
      city: shipping.city,
      state: shipping.state || undefined,
      postal_code: shipping.zip,
      country: shipping.country || 'US',
    },
  };
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + shippingCost + tax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shippingCost: Number(shippingCost.toFixed(2)),
    tax,
    total,
  };
}

function buildMockPaymentResponse(req, shipping, totals, metadata) {
  const mockIntentId = `pi_mock_${Date.now()}`;
  const mockClientSecret = `mock_secret_${req.user.id}_${Date.now()}`;

  return {
    paymentIntentId: mockIntentId,
    clientSecret: mockClientSecret,
    currency: 'usd',
    amount: Math.round(totals.total * 100),
    status: 'requires_payment_method',
    shipping: buildShippingAddress(shipping),
    totals,
    metadata,
    testMode: true,   // <-- tells the frontend to render MockStripePaymentForm
  };
}

// POST /api/payments/create-intent
router.post(
  '/create-intent',
  authenticateToken,
  paymentLimiter,
  paymentIntentValidation,
  async (req, res) => {
    try {
      const { amount, shipping } = req.body;
      const items = await Cart.getItems(req.user.id);

      if (!items.length) {
        return errorResponse(res, 'Your bag is empty. Add items before checking out.', 400);
      }

      const totals = calculateTotals(items);
      const requestedAmount = Number(amount);
      if (Math.abs(requestedAmount - totals.total) > 0.01) {
        logger.warn('Payment amount mismatch', {
          userId: req.user.id,
          requestedAmount,
          calculatedTotal: totals.total,
        });
        return errorResponse(res, 'The checkout total changed. Please review your bag and try again.', 400);
      }

      const itemCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);
      const metadata = {
        userId: String(req.user.id),
        itemCount: String(itemCount),
        subtotal: totals.subtotal.toFixed(2),
        shippingCost: totals.shippingCost.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
      };

      // --- MOCK MODE ---
      // When FORCE_MOCK_PAYMENT=true the backend never touches Stripe.
      // No incomplete intents will appear in the dashboard.
      if (process.env.FORCE_MOCK_PAYMENT === 'true') {
        logger.info('Mock payment mode active — skipping Stripe API call', { userId: req.user.id });
        return successResponse(res, buildMockPaymentResponse(req, shipping, totals, metadata), 'Payment intent prepared (mock).');
      }

      // --- NO KEY CONFIGURED ---
      if (!process.env.STRIPE_SECRET_KEY) {
        if (process.env.NODE_ENV === 'production') {
          return errorResponse(res, 'Payment processing is temporarily unavailable.', 503);
        }
        return successResponse(res, buildMockPaymentResponse(req, shipping, totals, metadata), 'Payment intent prepared (mock).');
      }

      // --- REAL STRIPE ---
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totals.total * 100),
          currency: 'usd',
          payment_method_types: ['card'],
          description: 'ShieldCart checkout',
          receipt_email: req.user.email,
          metadata,
          shipping: buildShippingAddress(shipping),
        });
      } catch (stripeError) {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('Stripe unavailable in development, using mock payment intent', {
            userId: req.user.id,
            message: stripeError.message,
          });
          return successResponse(res, buildMockPaymentResponse(req, shipping, totals, metadata), 'Payment intent prepared (mock).');
        }
        throw stripeError;
      }

      successResponse(res, {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        currency: paymentIntent.currency,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        shipping: paymentIntent.shipping,
        totals,
      }, 'Payment intent prepared.');
    } catch (error) {
      logger.error('Payment intent error:', { message: error.message });
      errorResponse(res, 'We could not prepare the payment just now.', 500);
    }
  }
);

module.exports = router;
