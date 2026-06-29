# API Integration & Verification Status

## Auth
- [x] `POST` `/api/auth/register` - User registration
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/auth/login` - User login
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/auth/logout` - User logout
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/auth/refresh` - Refresh JWT token
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `GET` `/api/auth/me` - Get current user details
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/auth/forgot-password` - Request a password reset
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed

## Products
- [x] `GET` `/api/products` - Get a list of all products
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `GET` `/api/products/categories` - Get all product categories
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `GET` `/api/products/:id` - Get a single product by ID
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed

## Cart
- [x] `GET` `/api/cart` - Get the current user's cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `GET` `/api/cart/count` - Get the number of items in the cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/cart/add` - Add an item to the cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `PUT` `/api/cart/update` - Update an item quantity in the cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `DELETE` `/api/cart/remove/:productId` - Remove an item from the cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `DELETE` `/api/cart/clear` - Clear all items from the cart
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed

## Payment
- [x] `POST` `/api/payments/create-intent` - Create a Stripe payment intent
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed

## WebAuthn
- [x] `POST` `/api/webauthn/register-options` - Request to register a new WebAuthn credential
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Passed
- [x] `POST` `/api/webauthn/register-verify` - Submit the response for WebAuthn registration
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Untested
- [x] `POST` `/api/webauthn/login-options` - Request to login with a WebAuthn credential
  - **Backend Status:** Implemented
  - **Frontend Status:** Ready
  - **E2E Testing:** Untested
- [x] `POST` `/api/webauthn/login-verify` - Submit the response for WebAuthn login
  - **Backend Status:** Implemented
  - **Frontend Status:** Ready
  - **E2E Testing:** Untested

## CSRF
- [ ] `GET` `/api/csrf-token` - Get a CSRF token
  - **Backend Status:** Implemented
  - **Frontend Status:** Integrated
  - **E2E Testing:** Untested

## TCP
- [x] Trusted device verification
  - Device fingerprints are scored and persisted in `device_trust`
- [x] Secure token handling
  - Refresh tokens are hashed, rotated, and revoked server-side
- [x] Trusted login validation
  - WebAuthn verification and device trust scoring are linked to login sessions
- [x] Secure communication channels
  - HTTPS is enforced in production through middleware
- [x] Secure credential storage
  - Passwords use bcrypt, and WebAuthn stores public keys only
