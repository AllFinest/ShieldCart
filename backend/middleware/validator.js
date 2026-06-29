/**
 * Input Validation Middleware
 *
 * Uses express-validator to validate and sanitize all user input
 * BEFORE it reaches controllers. This prevents:
 * - SQL injection (malicious SQL in input fields)
 * - XSS (script tags in input fields)
 * - Data integrity issues (invalid email formats, weak passwords)
 *
 * Validation rules are defined per-route and reused across the app.
 */

const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/helpers');

/**
 * Process validation results.
 * If any validation rule failed, return a 400 error with details.
 * Must be called AFTER the validation chain middleware.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return errorResponse(res, 'Validation failed.', 400, messages);
  }
  next();
}

/**
 * Registration validation rules.
 * Enforces strong passwords and valid email format.
 */
const registerValidation = [
  body('email')
    .isEmail().withMessage('Valid email address is required.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters.'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character.'),

  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters.')
    .escape(),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters.')
    .escape(),

  handleValidationErrors,
];

/**
 * Login validation rules.
 */
const loginValidation = [
  body('email')
    .isEmail().withMessage('Valid email address is required.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  handleValidationErrors,
];

/**
 * Password reset request validation.
 */
const passwordResetValidation = [
  body('email')
    .isEmail().withMessage('Valid email address is required.')
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * New password validation (for password reset completion).
 */
const newPasswordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character.'),

  body('token')
    .notEmpty().withMessage('Reset token is required.'),

  handleValidationErrors,
];

/**
 * WebAuthn registration verification validation.
 * Accepts either a real browser response or a development mock payload.
 */
const webauthnRegisterVerifyValidation = [
  body('mock')
    .optional()
    .isBoolean().withMessage('Mock mode must be a boolean.')
    .toBoolean(),

  body('credentialLabel')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Credential label must not exceed 100 characters.')
    .escape(),

  body('response')
    .optional({ nullable: true })
    .custom((value) => {
      if (value == null) return true;
      if (typeof value !== 'object') {
        throw new Error('Registration response must be an object.');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Payment intent validation.
 * Confirms the checkout payload includes a sane amount and shipping address.
 */
const paymentIntentValidation = [
  body('amount')
    .isFloat({ gt: 0 }).withMessage('Payment amount must be greater than zero.')
    .toFloat(),

  body('shipping.fullName')
    .trim()
    .notEmpty().withMessage('Recipient name is required.')
    .isLength({ max: 100 }).withMessage('Recipient name must not exceed 100 characters.')
    .escape(),

  body('shipping.address')
    .trim()
    .notEmpty().withMessage('Street address is required.')
    .isLength({ max: 255 }).withMessage('Street address must not exceed 255 characters.')
    .escape(),

  body('shipping.city')
    .trim()
    .notEmpty().withMessage('City is required.')
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters.')
    .escape(),

  body('shipping.state')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('State or region must not exceed 100 characters.')
    .escape(),

  body('shipping.zip')
    .trim()
    .notEmpty().withMessage('Postal code is required.')
    .isLength({ max: 20 }).withMessage('Postal code must not exceed 20 characters.')
    .escape(),

  body('shipping.country')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage('Country code must use the 2-letter format.')
    .toUpperCase(),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  newPasswordValidation,
  webauthnRegisterVerifyValidation,
  paymentIntentValidation,
  handleValidationErrors,
};
