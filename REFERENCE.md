# ShieldCart - Comprehensive Reference Guide

**Last Updated:** July 5, 2026  
**Version:** 1.0.0

---

## Table of Contents

1. [API Reference](#api-reference)
2. [External Dependencies & References](#external-dependencies--references)
3. [React Components Reference](#react-components-reference)
4. [Database Schema Reference](#database-schema-reference)
5. [Environment Configuration](#environment-configuration)

---

## API Reference

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://api.shieldcart.com/api`

### Authentication
All protected endpoints require:
- **Header:** `Authorization: Bearer {accessToken}`
- **Cookie:** `refreshToken` (httpOnly, secure)

---

### Authentication Endpoints

#### Register User
```
POST /auth/register
```
**Rate Limited:** Yes (authLimiter)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "trust": {
      "trustLevel": "LOW",
      "deviceFingerprint": "sha256:...",
      "sessionPolicy": {
        "accessTokenTtl": 900,
        "refreshTokenTtlMs": 2592000000
      }
    }
  },
  "message": "User registered successfully."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input, missing fields, or user exists
- `429 Too Many Requests` - Rate limit exceeded

---

#### Login User
```
POST /auth/login
```
**Rate Limited:** Yes (authLimiter)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "trust": {
      "trustLevel": "LOW",
      "deviceFingerprint": "sha256:...",
      "sessionAge": 0,
      "sessionPolicy": {
        "accessTokenTtl": 900,
        "refreshTokenTtlMs": 2592000000
      }
    }
  },
  "message": "Login successful."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Too many login attempts

---

#### Refresh Access Token
```
POST /auth/refresh
```
**Headers:**
- Cookie: `refreshToken` (sent via httpOnly cookie)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900,
    "sessionPolicy": {
      "accessTokenTtl": 900,
      "refreshTokenTtlMs": 2592000000
    }
  },
  "message": "Token refreshed successfully."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

#### Get Current User
```
GET /auth/me
```
**Authentication:** Required
**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "trust": {
      "trustLevel": "MEDIUM",
      "deviceFingerprint": "sha256:...",
      "sessionAge": 3600
    }
  },
  "message": "User retrieved successfully."
}
```

---

#### Logout User
```
POST /auth/logout
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

**Side Effects:**
- Invalidates refresh token
- Clears refresh token cookie
- Records session termination

---

#### Forgot Password
```
POST /auth/forgot-password
```
**Rate Limited:** Yes

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, you will receive password reset instructions."
}
```

**Note:** Returns same message regardless of account existence (security best practice)

---

### Product Endpoints

#### Get All Products
```
GET /products
```
**Authentication:** Not required

**Query Parameters:**
```
GET /products?category=electronics&search=headphones&page=1&limit=12
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category slug |
| `search` | string | - | Search product name/description |
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 12 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Wireless Noise-Cancelling Headphones",
        "description": "Premium wireless headphones...",
        "price": 149.99,
        "originalPrice": 199.99,
        "category": "electronics",
        "stock": 50,
        "imageUrl": "/images/products/headphones.jpg",
        "badge": "Best Seller",
        "rating": 4.80,
        "reviewCount": 234
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 150,
      "totalPages": 13
    }
  },
  "message": "Catalog loaded."
}
```

---

#### Get Product Categories
```
GET /products/categories
```
**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronics and gadgets",
      "icon": "FiMonitor"
    },
    {
      "id": 2,
      "name": "Clothing",
      "slug": "clothing",
      "description": "Apparel and accessories",
      "icon": "FiShoppingBag"
    }
  ],
  "message": "Aisles loaded."
}
```

---

#### Get Single Product
```
GET /products/:id
```
**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Product ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Noise-Cancelling Headphones",
    "description": "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    "price": 149.99,
    "originalPrice": 199.99,
    "category": "electronics",
    "stock": 50,
    "imageUrl": "/images/products/headphones.jpg",
    "badge": "Best Seller",
    "rating": 4.80,
    "reviewCount": 234
  },
  "message": "Item loaded."
}
```

**Error Responses:**
- `404 Not Found` - Product does not exist

---

### Cart Endpoints

#### Get Cart
```
GET /cart
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "name": "Wireless Headphones",
        "price": 149.99,
        "quantity": 1,
        "imageUrl": "/images/products/headphones.jpg"
      }
    ],
    "total": 149.99,
    "count": 1
  },
  "message": "Bag loaded."
}
```

---

#### Add to Cart
```
POST /cart/add
```
**Authentication:** Required

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 149.99,
    "count": 1
  },
  "message": "Item added to your bag."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid product ID or quantity

---

#### Update Cart Item Quantity
```
PUT /cart/update
```
**Authentication:** Required

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 299.98,
    "count": 2
  },
  "message": "Bag updated."
}
```

---

#### Remove Item from Cart
```
DELETE /cart/remove/:productId
```
**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | integer | Product ID to remove |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "count": 0
  },
  "message": "Item removed from your bag."
}
```

---

#### Clear Cart
```
DELETE /cart/clear
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "count": 0
  },
  "message": "Bag emptied."
}
```

---

#### Get Cart Item Count
```
GET /cart/count
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 1
  },
  "message": "Bag count loaded."
}
```

---

### Payment Endpoints

#### Create Payment Intent
```
POST /payments/create-intent
```
**Authentication:** Required  
**Rate Limited:** Yes (paymentLimiter)

**Request Body:**
```json
{
  "amount": 165.97,
  "shipping": {
    "fullName": "John Doe",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "US"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abcdef",
    "currency": "usd",
    "amount": 16597,
    "status": "requires_payment_method",
    "shipping": {
      "name": "John Doe",
      "address": {
        "line1": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "postal_code": "62701",
        "country": "US"
      }
    },
    "totals": {
      "subtotal": 149.99,
      "shippingCost": 5.99,
      "tax": 11.99,
      "total": 165.97
    },
    "testMode": false
  },
  "message": "Payment intent created."
}
```

**Error Responses:**
- `400 Bad Request` - Empty cart or amount mismatch
- `429 Too Many Requests` - Rate limit exceeded

---

### WebAuthn / FIDO2 Endpoints

#### Register WebAuthn Credential (Begin)
```
POST /webauthn/register/begin
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "options": {
      "challenge": "...",
      "rp": {
        "name": "ShieldCart",
        "id": "shieldcart.com"
      },
      "user": {
        "id": "...",
        "name": "user@example.com",
        "displayName": "John Doe"
      },
      "pubKeyCredParams": [...],
      "timeout": 60000,
      "attestation": "none"
    }
  },
  "message": "Registration options generated."
}
```

---

#### Register WebAuthn Credential (Verify)
```
POST /webauthn/register/verify
```
**Authentication:** Required

**Request Body:**
```json
{
  "credentialLabel": "My Fingerprint",
  "registrationResponse": {
    "id": "...",
    "rawId": "...",
    "response": {
      "clientDataJSON": "...",
      "attestationObject": "..."
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "credentialId": "...",
    "verified": true
  },
  "message": "Passkey registered successfully."
}
```

---

#### Authenticate with WebAuthn (Begin)
```
POST /webauthn/authenticate/begin
```
**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "options": {
      "challenge": "...",
      "timeout": 60000,
      "rpId": "shieldcart.com",
      "userVerification": "preferred",
      "allowCredentials": [...]
    }
  },
  "message": "Authentication options generated."
}
```

---

#### Authenticate with WebAuthn (Verify)
```
POST /webauthn/authenticate/verify
```
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "authenticationResponse": {
    "id": "...",
    "rawId": "...",
    "response": {
      "clientDataJSON": "...",
      "authenticatorData": "...",
      "signature": "..."
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "trust": {
      "trustLevel": "HIGH",
      "biometricVerified": true,
      "deviceFingerprint": "sha256:..."
    }
  },
  "message": "Biometric authentication successful."
}
```

---

## External Dependencies & References

### Backend Dependencies

#### Core Framework & Server
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.21.2 | Web framework for Node.js |
| `dotenv` | ^16.4.7 | Environment variable management |
| `nodejs` | >=14.0.0 | JavaScript runtime |

#### Authentication & Security
| Package | Version | Purpose |
|---------|---------|---------|
| `bcrypt` | ^5.1.1 | Password hashing (12 salt rounds) |
| `jsonwebtoken` | ^9.0.2 | JWT token generation & validation |
| `@simplewebauthn/server` | ^11.0.0 | WebAuthn/FIDO2 server library |
| `csrf-csrf` | ^3.0.6 | CSRF double-submit cookie pattern |
| `helmet` | ^8.0.0 | Secure HTTP response headers (CSP, HSTS) |
| `express-rate-limit` | ^7.5.0 | Rate limiting middleware |

#### Data & Database
| Package | Version | Purpose |
|---------|---------|---------|
| `mysql2` | ^3.12.0 | MySQL database driver (connection pooling) |
| `uuid` | ^11.1.0 | UUID generation for session IDs |

#### Input Validation & Sanitization
| Package | Version | Purpose |
|---------|---------|---------|
| `express-validator` | ^7.2.1 | Input validation & sanitization |

#### Payment Processing
| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | ^17.5.0 | Stripe payment API client |

#### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `cookie-parser` | ^1.4.7 | Cookie parsing middleware |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `winston` | ^3.17.0 | Application logging |

#### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.1.9 | Auto-restart on file changes |
| `eslint` | ^8.57.0 | Code linting |

---

### Frontend Dependencies

#### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.6 | UI library |
| `react-dom` | ^19.2.6 | React DOM rendering |
| `vite` | ^8.0.12 | Fast build tool & dev server |

#### Routing & Navigation
| Package | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | ^7.15.1 | Client-side routing with protected routes |

#### HTTP Client
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.16.1 | HTTP client with interceptors & token handling |

#### Payment Integration
| Package | Version | Purpose |
|---------|---------|---------|
| `@stripe/stripe-js` | ^9.8.0 | Stripe.js SDK for payment handling |
| `@stripe/react-stripe-js` | ^6.6.0 | React components for Stripe |

#### UI & UX
| Package | Version | Purpose |
|---------|---------|---------|
| `react-icons` | ^5.6.0 | Icon library (Feather icons) |
| `react-hot-toast` | ^2.6.0 | Toast notifications |

#### Build Tools & Development
| Package | Version | Purpose |
|---------|---------|---------|
| `@vitejs/plugin-react` | ^6.0.1 | Vite React plugin |
| `eslint` | ^10.3.0 | Code linting |
| `eslint-plugin-react-hooks` | ^7.1.1 | React hooks linting rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | React refresh linting |

---

### External Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Stripe** | Payment processing (PCI-compliant) | Sandbox mode |
| **MySQL Database** | Data persistence | InnoDB tables |
| **WebAuthn / FIDO2** | Biometric authentication | CTAP2 support |

---

## React Components Reference

### Layout Components

#### `Navbar.jsx`
- **Location:** [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx)
- **Purpose:** Main navigation bar with links and cart counter
- **Props:** None
- **State:** Uses `CartContext` for cart count
- **Features:**
  - Responsive navigation menu
  - Cart item count badge
  - User authentication status display

#### `Footer.jsx`
- **Location:** [frontend/src/components/Footer.jsx](frontend/src/components/Footer.jsx)
- **Purpose:** Application footer with links and information
- **Props:** None
- **Features:** Links to About, Privacy Policy, Contact

---

### Route Protection Components

#### `ProtectedRoute.jsx`
- **Location:** [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)
- **Purpose:** Wraps routes requiring authentication
- **Props:**
  - `children` (ReactNode) - Component to render if authenticated
- **Behavior:** Redirects to login if unauthenticated
- **State:** Uses `AuthContext` for auth state

#### `AdminRoute.jsx`
- **Location:** [frontend/src/components/AdminRoute.jsx](frontend/src/components/AdminRoute.jsx)
- **Purpose:** Wraps routes requiring admin role
- **Props:**
  - `children` (ReactNode) - Component to render if admin
- **Behavior:** Redirects to home if not admin role
- **State:** Uses `AuthContext` for role check

---

### Page Components

#### `Home.jsx`
- **Location:** [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
- **Purpose:** Landing page with hero, featured products, testimonials
- **Components Used:** HeroSection, FeaturedProducts, PromoSection, Testimonials, WhyShopWithUs
- **Features:** Call-to-action buttons, product carousel

#### `Login.jsx`
- **Location:** [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)
- **Purpose:** User login page
- **Features:**
  - Email/password form
  - WebAuthn/biometric login
  - Forgot password link
  - Register link
- **State:** Uses `AuthContext` for login action

#### `Register.jsx`
- **Location:** [frontend/src/pages/Register.jsx](frontend/src/pages/Register.jsx)
- **Purpose:** User registration page
- **Features:**
  - Email, password, name form
  - Password strength validation
  - Login link
- **State:** Uses `AuthContext` for register action

#### `Products.jsx`
- **Location:** [frontend/src/pages/Products.jsx](frontend/src/pages/Products.jsx)
- **Purpose:** Product listing page with filters
- **Features:**
  - Category filter
  - Search functionality
  - Pagination
  - Add to cart buttons
- **State:** Uses `CartContext` for adding items

#### `ProductDetail.jsx`
- **Location:** [frontend/src/pages/ProductDetail.jsx](frontend/src/pages/ProductDetail.jsx)
- **Purpose:** Single product detail page
- **Features:**
  - Product image & details
  - Reviews & ratings
  - Add to cart with quantity selector
- **Props (Route Params):**
  - `id` (productId) - Product ID from URL

#### `Cart.jsx`
- **Location:** [frontend/src/pages/Cart.jsx](frontend/src/pages/Cart.jsx)
- **Purpose:** Shopping cart page
- **Features:**
  - View cart items
  - Update quantities
  - Remove items
  - Proceed to checkout link
- **State:** Uses `CartContext`

#### `Checkout.jsx`
- **Location:** [frontend/src/pages/Checkout.jsx](frontend/src/pages/Checkout.jsx)
- **Purpose:** Payment page
- **Features:**
  - Shipping address form
  - Order summary
  - Stripe payment form
- **Components:** StripePaymentForm
- **State:** Uses `AuthContext` and `CartContext`

#### `ForgotPassword.jsx`
- **Location:** [frontend/src/pages/ForgotPassword.jsx](frontend/src/pages/ForgotPassword.jsx)
- **Purpose:** Password reset request
- **Features:** Email input, submit button

#### `Orders.jsx`
- **Location:** [frontend/src/pages/Orders.jsx](frontend/src/pages/Orders.jsx)
- **Purpose:** Order history page (protected)
- **Features:** Display past orders, statuses

#### `About.jsx`
- **Location:** [frontend/src/pages/About.jsx](frontend/src/pages/About.jsx)
- **Purpose:** About page with company information

#### `PrivacyPolicy.jsx`
- **Location:** [frontend/src/pages/PrivacyPolicy.jsx](frontend/src/pages/PrivacyPolicy.jsx)
- **Purpose:** Legal privacy policy page

#### `NotFound.jsx`
- **Location:** [frontend/src/pages/NotFound.jsx](frontend/src/pages/NotFound.jsx)
- **Purpose:** 404 error page

---

### Home Page Sub-Components

#### `HeroSection.jsx`
- **Location:** [frontend/src/components/home/HeroSection.jsx](frontend/src/components/home/HeroSection.jsx)
- **Purpose:** Header banner with main call-to-action
- **Features:** Hero image, headline, button link

#### `FeaturedProducts.jsx`
- **Location:** [frontend/src/components/home/FeaturedProducts.jsx](frontend/src/components/home/FeaturedProducts.jsx)
- **Purpose:** Display featured/top-selling products
- **Features:** Product grid, ratings, "Add to Cart" buttons

#### `PromoSection.jsx`
- **Location:** [frontend/src/components/home/PromoSection.jsx](frontend/src/components/home/PromoSection.jsx)
- **Purpose:** Promotional banner
- **Features:** Discount messaging, CTA

#### `Testimonials.jsx`
- **Location:** [frontend/src/components/home/Testimonials.jsx](frontend/src/components/home/Testimonials.jsx)
- **Purpose:** Customer reviews/testimonials carousel
- **Features:** Star ratings, customer quotes

#### `WhyShopWithUs.jsx`
- **Location:** [frontend/src/components/home/WhyShopWithUs.jsx](frontend/src/components/home/WhyShopWithUs.jsx)
- **Purpose:** Trust badges and benefits
- **Features:** Security badges, shipping info, support details

#### `CategoryGrid.jsx`
- **Location:** [frontend/src/components/home/CategoryGrid.jsx](frontend/src/components/home/CategoryGrid.jsx)
- **Purpose:** Category browsing shortcuts
- **Features:** Category cards with icons and links

---

### Checkout Components

#### `StripePaymentForm.jsx`
- **Location:** [frontend/src/components/checkout/StripePaymentForm.jsx](frontend/src/components/checkout/StripePaymentForm.jsx)
- **Purpose:** Stripe payment form container
- **Features:**
  - Card element integration
  - Payment processing
  - Error handling
- **Props:**
  - `clientSecret` - Stripe payment intent secret
  - `shippingData` - Shipping address object
  - `onPaymentSuccess` - Callback after successful payment

---

### Common Components

#### `LoadingSpinner.jsx`
- **Location:** [frontend/src/components/common/LoadingSpinner.jsx](frontend/src/components/common/LoadingSpinner.jsx)
- **Purpose:** Loading indicator
- **Props:**
  - `size` (string) - Size: 'small', 'medium', 'large'
  - `text` (string) - Loading message

#### `Toast.jsx`
- **Location:** [frontend/src/components/common/Toast.jsx](frontend/src/components/common/Toast.jsx)
- **Purpose:** Notification toast display
- **Features:** Success, error, info, warning types
- **Usage:** Uses `react-hot-toast` library

#### `TrustBadges.jsx`
- **Location:** [frontend/src/components/common/TrustBadges.jsx](frontend/src/components/common/TrustBadges.jsx)
- **Purpose:** Display security/trust indicators
- **Features:** SSL certificate, secure payment, privacy badges

---

### Context Providers

#### `AuthContext.jsx`
- **Location:** [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- **Purpose:** Global authentication state management
- **Exports:**
  - `AuthProvider` - Context provider component
  - `useAuth()` - Hook to access auth state

**State Properties:**
```javascript
{
  user: {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    role: string
  },
  accessToken: string,
  isAuthenticated: boolean,
  trust: {
    trustLevel: string,
    deviceFingerprint: string,
    biometricVerified: boolean
  }
}
```

**State Methods:**
- `login(email, password)` - Authenticate with credentials
- `register(email, password, firstName, lastName)` - Create new account
- `logout()` - Clear session
- `loginWithWebAuthn(email)` - Authenticate with biometric
- `refreshToken()` - Get new access token

#### `CartContext.jsx`
- **Location:** [frontend/src/context/CartContext.jsx](frontend/src/context/CartContext.jsx)
- **Purpose:** Global cart state management
- **Exports:**
  - `CartProvider` - Context provider component
  - `useCart()` - Hook to access cart state

**State Properties:**
```javascript
{
  items: [
    {
      productId: number,
      name: string,
      price: number,
      quantity: number,
      imageUrl: string
    }
  ],
  total: number,
  count: number
}
```

**State Methods:**
- `getCart()` - Load cart from API
- `addItem(productId, quantity)` - Add product to cart
- `updateQuantity(productId, quantity)` - Change item quantity
- `removeItem(productId)` - Remove item from cart
- `clearCart()` - Empty entire cart

---

## Database Schema Reference

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  is_active TINYINT(1) DEFAULT 1,
  email_verified TINYINT(1) DEFAULT 0,
  last_login DATETIME NULL,
  login_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Indexes:**
- `idx_users_email` - Email lookup (unique)
- `idx_users_role` - Role-based filtering

---

#### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  trust_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
  device_fingerprint VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  revoked TINYINT(1) DEFAULT 0,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Purpose:** Stores hashed refresh tokens for stateless session management  
**Key Fields:**
- `token_hash` - Hashed refresh token (never stores plaintext)
- `trust_level` - Device trust classification
- `device_fingerprint` - Client device identifier

---

#### WebAuthn Credentials Table
```sql
CREATE TABLE webauthn_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  credential_id VARCHAR(512) NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INT DEFAULT 0,
  device_type VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Purpose:** Stores WebAuthn/FIDO2 passkey credentials for biometric auth  
**Key Fields:**
- `public_key` - Public key material (only public key stored, never private)
- `counter` - Cloned authenticator detection
- `device_type` - Platform vs cross-platform authenticator

---

#### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Purpose:** Single-use tokens for password reset flow  
**Lifecycle:** Expires after 1 hour, marked `used=1` after redemption

---

#### Device Trust Table
```sql
CREATE TABLE device_trust (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  trust_score DECIMAL(5,2) DEFAULT 0.00,
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  is_trusted TINYINT(1) DEFAULT 0,
  last_seen DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_device_fingerprint (user_id, device_fingerprint)
)
```

**Purpose:** Trusted Computing Platform (TCP) device tracking  
**Trust Scoring:** Calculated based on login patterns, WebAuthn verification, location changes

---

### Product Tables

#### Product Categories Table
```sql
CREATE TABLE product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  icon VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Standard Categories:**
- Electronics
- Clothing
- Home & Garden
- Sports
- Books
- Beauty

---

#### Products Table
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NULL,
  category_id INT NULL,
  stock_quantity INT DEFAULT 0,
  image_url VARCHAR(500) NULL,
  badge VARCHAR(50) NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
)
```

**Badge Types:** 'Best Seller', 'Sale', 'New', 'Top Rated'

---

### Shopping & Orders

#### Carts Table
```sql
CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Note:** One cart per user (1:1 relationship)

---

#### Cart Items Table
```sql
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_cart_product (cart_id, product_id)
)
```

**Constraint:** One entry per product per cart (ensures uniqueness)

---

#### Orders Table
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSON NULL,
  payment_intent_id VARCHAR(255) NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  estimated_delivery DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Status Workflow:** pending → processing → shipped → delivered

---

#### Order Items Table
```sql
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
)
```

**Purpose:** Historical snapshot of product pricing at time of purchase

---

### Reviews & Feedback

#### Product Reviews Table
```sql
CREATE TABLE product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_review_unique (product_id, user_id)
)
```

**Constraint:** One review per user per product

---

### Audit & Security Logging

#### Activity Logs Table
```sql
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Tracked Actions:** 'login', 'logout', 'purchase', 'add_to_cart', etc.

---

#### Security Events Table
```sql
CREATE TABLE security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Event Types:** 'failed_login', 'rate_limit_exceeded', 'suspicious_location', etc.  
**Severity Levels:** 'low', 'medium', 'high', 'critical'

---

### Database Relationships Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (UQ)      │◄──┐
│ password_hash   │   │
│ role            │   │
│ ...             │   │
└─────────────────┘   │
        ▲              │
        │              │
    1:M │          1:M │  1:M
        │              │
┌───────┴──────────────┴──────────────────┬─────────────────────┬────────────────────┐
│                                         │                     │                    │
│                                         │                     │                    │
┌───────────────────────┐  ┌──────────────────────────┐  ┌────────────────────┐   │
│ refresh_tokens        │  │ webauthn_credentials     │  │ device_trust       │   │
├───────────────────────┤  ├──────────────────────────┤  ├────────────────────┤   │
│ id (PK)               │  │ id (PK)                  │  │ id (PK)            │   │
│ user_id (FK)          │  │ user_id (FK)             │  │ user_id (FK)       │   │
│ session_id (UQ)       │  │ credential_id (UQ)       │  │ device_fingerprint │   │
│ token_hash            │  │ public_key               │  │ trust_score        │   │
│ trust_level           │  │ counter                  │  │ ...                │   │
│ ...                   │  │ ...                      │  │                    │   │
└───────────────────────┘  └──────────────────────────┘  └────────────────────┘   │
                                                                                    │
                                                                                    │
┌───────────────────────────────────┐   ┌──────────────────┐   ┌─────────────────┐│
│ password_reset_tokens             │   │ activity_logs    │   │ security_events ││
├───────────────────────────────────┤   ├──────────────────┤   ├─────────────────┤│
│ id (PK)                           │   │ id (PK)          │   │ id (PK)         ││
│ user_id (FK)                      │   │ user_id (FK)     │   │ user_id (FK)    ││
│ token_hash                        │   │ action           │   │ event_type      ││
│ expires_at                        │   │ details (JSON)   │   │ severity        ││
│ ...                               │   │ ...              │   │ ...             ││
└───────────────────────────────────┘   └──────────────────┘   └─────────────────┘│
                                                                                    │
├────────────────────────────────────────────────────────────────────────────────┘
│
┌───────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTS & SHOPPING                                  │
└───────────────────────────────────────────────────────────────────────────────┘
│
├─────────────────────────┐        ┌─────────────────────────┐        ┌────────────────────┐
│  product_categories     │◄──1:M──│      products           │───1:M──►│  product_reviews   │
├─────────────────────────┤        ├─────────────────────────┤        ├────────────────────┤
│ id (PK)                 │        │ id (PK)                 │        │ id (PK)            │
│ name (UQ)               │        │ category_id (FK)        │        │ product_id (FK)    │
│ slug (UQ)               │        │ price                   │        │ user_id (FK)       │
│ ...                     │        │ stock_quantity          │        │ rating             │
│                         │        │ ...                     │        │ ...                │
└─────────────────────────┘        └─────────────────────────┘        └────────────────────┘
                                          ▲
                                      1:M │
                                          │
                                      ┌───┴──────────────────────────┐
                                      │                              │
                        ┌─────────────────────┐          ┌─────────────────────┐
                        │  carts              │          │  order_items        │
                    ┌───┤─────────────────────┤◄──1:M────┤─────────────────────┤
                    │   │ id (PK)             │          │ id (PK)             │
                    │   │ user_id (FK)        │          │ product_id (FK)     │
                1:1 │   │ ...                 │          │ order_id (FK)       │
                    │   └─────────────────────┘          │ unit_price          │
                    │           ▲                        │ ...                 │
                    │       1:M │                        └─────────────────────┘
                    │           │                                  ▲
                    │   ┌───────┴──────────┐                       │
                    │   │  cart_items      │                   1:M │
                    │   ├──────────────────┤                       │
                    │   │ id (PK)          │                   ┌─────────────┐
                    │   │ cart_id (FK)     │                   │   orders    │
                    │   │ product_id (FK)  │                   ├─────────────┤
                    │   │ quantity         │                   │ id (PK)     │
                    │   │ ...              │                   │ user_id (FK)│
                    └───┤                  │                   │ status      │
                        └──────────────────┘                   │ total       │
                                                               │ ...         │
                                                               └─────────────┘
```

---

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=secure_ecommerce
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Tokens
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d

# WebAuthn / FIDO2
WEBAUTHN_RP_NAME=ShieldCart
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:5000
WEBAUTHN_EXPECTED_ORIGIN=http://localhost:5000

# Stripe Payment
STRIPE_PUBLIC_KEY=pk_test_xxx...
STRIPE_SECRET_KEY=sk_test_xxx...
FORCE_MOCK_PAYMENT=false

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=debug

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

### Frontend Environment Variables (.env)

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx...
VITE_APP_NAME=ShieldCart
VITE_APP_ENV=development
```

---

### Required Credentials & Setup

1. **Database:** Create MySQL database with schema.sql
2. **Stripe:** Sign up at https://stripe.com, get test keys
3. **WebAuthn:** No external setup required for development
4. **JWT Secret:** Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Security Features Summary

| Feature | Implementation | Status |
|---------|----------------|--------|
| **Password Security** | bcrypt (12 rounds) | ✅ Active |
| **Transport Security** | HTTPS/TLS 1.3 | ✅ Production Ready |
| **API Authentication** | JWT + Refresh Tokens | ✅ Active |
| **Biometric Auth** | WebAuthn/FIDO2 | ✅ Active |
| **Rate Limiting** | express-rate-limit | ✅ Active |
| **CSRF Protection** | Double-submit cookies | ✅ Active |
| **Input Validation** | express-validator | ✅ Active |
| **SQL Injection Prevention** | Parameterized queries | ✅ Active |
| **XSS Prevention** | Content Security Policy | ✅ Active |
| **Secure Headers** | Helmet middleware | ✅ Active |
| **Device Trust (TCP)** | Trust scoring + fingerprinting | ✅ Active |
| **Session Management** | Secure httpOnly cookies | ✅ Active |
| **Token Rotation** | Refresh token rotation | ✅ Active |

---

## Useful Commands & Debugging

### Backend Commands
```bash
# Start development server
npm run dev

# Start production server
npm start

# Run linter
npm run lint
```

### Frontend Commands
```bash
# Start dev server (Vite)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Database Commands
```bash
# Connect to database
mysql -u root -p secure_ecommerce

# Initialize schema
mysql -u root -p secure_ecommerce < backend/sql/schema.sql

# View all tables
SHOW TABLES;

# Check user records
SELECT id, email, role, created_at FROM users;
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` MySQL error | Database not running | Start MySQL service |
| JWT verification fails | Wrong secret key | Verify `JWT_SECRET` matches |
| CORS errors | Frontend domain mismatch | Update `CORS_ORIGIN` in .env |
| Stripe payment fails | Test mode not enabled | Use Stripe test keys, not live |
| WebAuthn not working | Wrong origin | Verify `WEBAUTHN_ORIGIN` matches request origin |
| Rate limit exceeded | Too many requests | Wait 15 minutes or check rate limit config |

---

## Testing Credentials

### Test User Account
- **Email:** test@example.com
- **Password:** TestPass@123

### Test Credit Card (Stripe Sandbox)
- **Card Number:** 4242 4242 4242 4242
- **Expiry:** 12/25
- **CVC:** 123

### Test Biometric
- Use your device's native fingerprint/Face ID for WebAuthn testing

---

## API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 10 requests | 15 minutes |
| `/auth/login` | 10 requests | 15 minutes |
| `/auth/refresh` | 20 requests | 15 minutes |
| `/payments/create-intent` | 20 requests | 15 minutes |
| All other endpoints | 100 requests | 15 minutes |

---

**End of Reference Guide**

This comprehensive reference covers all major aspects of the ShieldCart application. For additional details, refer to:
- [docs/architecture.md](docs/architecture.md) for system design
- [docs/security.md](docs/security.md) for security controls
- [API_TRACKING.md](API_TRACKING.md) for current development status
- [README.md](README.md) for project overview
