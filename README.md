# Secure E-Commerce Platform

A university project demonstrating secure e-commerce application development using Trusted Computing Platform (TCP) concepts, biometric authentication, payment API integration, and user trust models.

## Technology Stack

### Frontend
- **React.js** with **Vite** — fast, modern build tooling
- **React Router** — client-side routing with protected routes
- **Axios** — HTTP client with interceptors for token handling

### Backend
- **Node.js** with **Express.js** — RESTful API server
- **MySQL** — relational database with prepared statements
- **JWT** — stateless authentication tokens
- **bcrypt** — password hashing (12 salt rounds)
- **WebAuthn** — FIDO2 biometric authentication

### Security
- **Helmet** — secure HTTP response headers
- **express-rate-limit** — brute-force protection
- **CORS** — cross-origin request control
- **CSRF protection** — anti-forgery tokens
- **Input validation** — express-validator sanitization
- **Prepared statements** — SQL injection prevention

### Payment
- **Stripe Sandbox** — PCI-compliant payment processing

## Project Structure

```
secure-ecommerce/
├── backend/
│   ├── config/          # Database, Stripe, and app configuration
│   ├── controllers/     # Request handlers (business logic entry)
│   ├── middleware/       # Auth, CSRF, rate-limit, security middleware
│   ├── models/          # Database query abstraction layer
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic and external service integration
│   ├── utils/           # Shared helpers and logger
│   ├── sql/             # Database schema and seed data
│   ├── app.js           # Express app configuration
│   ├── server.js        # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level page components
│   │   ├── services/    # API client and service layer
│   │   ├── context/     # React Context providers (auth, cart)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Frontend utility functions
│   │   └── styles/      # CSS stylesheets
│   ├── public/          # Static assets
│   ├── vite.config.js   # Vite build configuration
│   └── package.json
├── docs/                # Architecture and security documentation
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MySQL >= 8.0
- npm >= 9.x

### Backend Setup
```bash
cd backend
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on http://localhost:5173
```

### Database Setup
```bash
mysql -u root -p < backend/sql/schema.sql
```

## Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT with httpOnly cookies + bcrypt hashing |
| Biometrics | WebAuthn/FIDO2 fingerprint authentication |
| SQL Injection | Parameterized queries with mysql2 |
| XSS Prevention | Helmet CSP headers + input sanitization |
| CSRF Protection | Double-submit cookie pattern |
| Rate Limiting | express-rate-limit on auth endpoints |
| Session Security | Secure cookie flags, session timeout |
| HTTPS | TLS enforcement in production |
| Trust Model | Device fingerprinting + trust scoring |

## Academic Context

This project satisfies requirements for demonstrating:
- Trusted Computing Platform (TCP) security concepts
- Technology Acceptance Model (TAM) integration
- Cybersecurity best practices in web application development
- Biometric authentication using FIDO2/WebAuthn standards

## License

This project is developed for academic purposes.
