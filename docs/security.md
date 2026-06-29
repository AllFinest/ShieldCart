# Security Controls

## Defense-in-Depth Strategy

This application implements multiple layers of security controls. If one layer is bypassed, the next layer provides protection.

| Layer | Control | Implementation |
|-------|---------|----------------|
| Network | HTTPS/TLS | TLS 1.3 encryption in production |
| Transport | Secure headers | Helmet middleware (CSP, HSTS, X-Frame) |
| Application | Input validation | express-validator on all user input |
| Application | Rate limiting | express-rate-limit on auth/payment endpoints |
| Application | CSRF protection | Double-submit cookie pattern |
| Authentication | Password hashing | bcrypt with 12 salt rounds |
| Authentication | JWT tokens | Short-lived access + httpOnly refresh |
| Authentication | Biometrics | WebAuthn/FIDO2 fingerprint |
| Authorization | Role-based access | Middleware role checks |
| Data | SQL injection prevention | Parameterized queries (mysql2) |
| Data | XSS prevention | CSP headers + input sanitization |
| Trust | Device verification | Device fingerprinting + trust scoring |
| Trust | Session management | Timeout, secure cookie flags |
| Trust | Secure token handling | Hashed refresh-token sessions + rotation |
| Trust | Trusted login validation | Passkey verification with device trust scoring |
| Transport | Secure communication channels | HTTPS enforcement in production |
| Storage | Secure credential storage | bcrypt passwords + WebAuthn public keys only |

## Threat Mitigation Matrix

| Threat | OWASP Category | Mitigation |
|--------|---------------|------------|
| SQL Injection | A03:2021 | Prepared statements via mysql2 |
| XSS | A03:2021 | Helmet CSP + escape() in validators |
| CSRF | A01:2021 | Double-submit cookie pattern |
| Brute Force | A07:2021 | Rate limiting (10 auth attempts/15min) |
| Session Hijacking | A07:2021 | httpOnly + secure + sameSite cookies |
| Credential Stuffing | A07:2021 | Rate limiting + bcrypt slow hashing |
| Clickjacking | A05:2021 | X-Frame-Options: DENY |
| MIME Sniffing | A05:2021 | X-Content-Type-Options: nosniff |
| Sensitive Data Exposure | A02:2021 | bcrypt hashing, env vars for secrets |
