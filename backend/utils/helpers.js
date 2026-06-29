/**
 * Shared Helper Utilities
 *
 * Pure utility functions used across the backend.
 * Each function is small, testable, and side-effect free.
 */

/**
 * Standardized API success response.
 * Consistent response shape makes frontend parsing predictable.
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standardized API error response.
 * Never leaks internal error details to the client in production.
 */
function errorResponse(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message,
  };

  if (errors && process.env.NODE_ENV !== 'production') {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Sanitize a string for safe storage/display.
 * Strips HTML tags and trims whitespace.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

module.exports = {
  successResponse,
  errorResponse,
  sanitizeString,
};
