# System Architecture

## Overview

The Secure E-Commerce platform follows a **three-tier architecture** separating presentation, business logic, and data layers. This design enforces the principle of least privilege — each layer only accesses the layer directly below it.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT TIER                       │
│              React.js (Vite) SPA                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  Pages   │ │Components│ │  Context (Auth/Cart) │ │
│  └────┬─────┘ └──────────┘ └──────────┬───────────┘ │
│       │                               │              │
│  ┌────┴───────────────────────────────┴───────────┐ │
│  │           Axios API Client (services/api.js)    │ │
│  │  • JWT token attachment via interceptors        │ │
│  │  • CSRF token handling                          │ │
│  │  • Automatic token refresh on 401               │ │
│  └────────────────────┬───────────────────────────┘ │
└───────────────────────┼─────────────────────────────┘
                        │ HTTPS (TLS 1.3)
                        ▼
┌─────────────────────────────────────────────────────┐
│                  APPLICATION TIER                    │
│               Node.js / Express.js                   │
│                                                      │
│  ┌─── Middleware Pipeline ────────────────────────┐  │
│  │  Helmet → CORS → Rate Limit → Body Parse →    │  │
│  │  Cookie Parse → CSRF Check → Route Handler     │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Routes  │→│Controllers│→│     Services       │  │
│  └──────────┘ └──────────┘ │ • authService       │  │
│                             │ • tokenService      │  │
│                             │ • trustService      │  │
│                             └────────┬───────────┘  │
│                                      │               │
│  ┌───────────────────────────────────┴────────────┐  │
│  │              Models (DB Queries)                │  │
│  │  • Parameterized queries (SQL injection safe)   │  │
│  └───────────────────────┬────────────────────────┘  │
└──────────────────────────┼──────────────────────────┘
                           │ mysql2 connection pool
                           ▼
┌─────────────────────────────────────────────────────┐
│                    DATA TIER                         │
│                 MySQL 8.0 (InnoDB)                   │
│                                                      │
│  Tables: users, products, cart_items, orders,        │
│          order_items, webauthn_credentials,           │
│          device_trust, refresh_tokens                 │
└─────────────────────────────────────────────────────┘
```

## Security Architecture

### Authentication Flow
```
Client                    Server                    Database
  │                         │                          │
  │── POST /auth/register ──►                          │
  │   (email, password)     │── hash(password) ───────►│
  │                         │   bcrypt 12 rounds       │
  │◄── 201 + tokens ───────│                          │
  │                         │                          │
  │── POST /auth/login ────►                          │
  │   (email, password)     │── compare(hash) ────────►│
  │                         │   constant-time          │
  │◄── accessToken ────────│                          │
  │    (in JSON body)       │                          │
  │◄── refreshToken ───────│                          │
  │    (httpOnly cookie)    │                          │
  │                         │                          │
  │── GET /api/resource ───►                          │
  │   Authorization: Bearer │── verify JWT ───────────►│
  │                         │                          │
```

### Trust Computing Model
```
Device Trust Score Calculation:

  Known Device (+30)  ──┐
  Biometric Auth (+40) ─┤
  Consistent IP (+15) ──┼── Trust Score (0-100)
  Valid Session (+15) ──┘
                           │
                    ┌──────┴──────┐
                    │ Score >= 70 │ → HIGH trust   → Full access
                    │ Score >= 40 │ → MEDIUM trust → Standard access
                    │ Score < 40  │ → LOW trust    → Restricted + re-auth
                    └─────────────┘
```

## Module Dependency Graph

```
server.js
  └── app.js
        ├── middleware/security.js    (helmet, cors, cookieParser)
        ├── middleware/rateLimiter.js (generalLimiter, authLimiter, paymentLimiter)
        ├── middleware/csrf.js        (doubleCsrfProtection)
        ├── routes/
        │     ├── authRoutes.js      → controllers → services/authService.js
        │     ├── productRoutes.js   → controllers → models (DB queries)
        │     ├── cartRoutes.js      → controllers → models (DB queries)
        │     ├── paymentRoutes.js   → controllers → config/stripe.js
        │     └── webauthnRoutes.js  → controllers → config/webauthn.js
        └── config/
              ├── db.js              (mysql2 pool)
              ├── stripe.js          (Stripe SDK)
              └── webauthn.js        (RP configuration)
```
